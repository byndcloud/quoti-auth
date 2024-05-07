const { flattenDeep, uniq } = require('lodash')
const axios = require('axios')
const Permissions = require('./permissions')
const { parseAxiosError, validateLogLevel } = require('./utils/logger')
const axiosRetry = require('axios-retry')

const logModule = '[quoti-auth]'

axiosRetry(axios, {
  retries: 5,
  retryCondition: () => axiosRetry.isRetryableError,
  retryDelay: axiosRetry.exponentialDelay
})

/**
 * @callback Middleware
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */

/**
 * @typedef {Object} AdvancedPermissionMiddlewareOptions
 * @property {import('./permissions').Validators} [permissionsToValidate] Permissions to validate
 * @property {string[]} [permissionsToFetch] Permissions to fetch
 */
/**
 * @typedef {AdvancedPermissionMiddlewareOptions | import('./permissions').Validators} PermissionMiddlewareOptions
 */

class QuotiAuth {
  /**
   * @description Setups the orgSlug and apiKey
   * @param {String} orgSlug - Organization slug
   * @param {String} apiKey - Quoti API key
   * @param {Function} [getUserData] - function that returns user data
   * @param {Object} [logger] - Winston logger
   * @param {String} [errorLogLevel] - Winston log level
   */
  constructor (orgSlug, apiKey, getUserData, logger, errorLogLevel) {
    this.setup({ orgSlug, apiKey, getUserData, logger, errorLogLevel })
  }

  /**
   * @param {Object} param0
   * @param {string} param0.token
   * @param {string} param0.orgSlug
   * @returns {Promise<import('../types/user').UserData | string>}
   */
  async getUserData ({ token, orgSlug, includePermissions }) {
    const url = 'https://api.quoti.cloud/api/v1/'
    const headers = {
      ApiKey: this.apiKey
    }

    const stringJSON = JSON.stringify(includePermissions)
    const urlEncondedPermissions = encodeURIComponent(stringJSON)

    const { data } = await axios.post(
      `${url}${
        orgSlug || this.orgSlug
      }/auth/login/getuser?includePermissions=${urlEncondedPermissions}`,
      { token },
      { headers }
    )
    return data
  }

  /**
   * @description Setups the orgSlug and apiKey
   * @param {Object} params - { orgSlug, apiKey, getUserData, logger }
   * @param {String} params.orgSlug - Organization slug
   * @param {String} params.apiKey - Quoti API key
   * @param {Function} [params.getUserData] - function that returns user data
   * @param {Object} [params.logger] - Winston logger
   * @param {String} [params.errorLogLevel] - Winston log level
   */
  setup ({
    orgSlug,
    apiKey,
    getUserData,
    logger,
    errorLogLevel = 'error'
  } = {}) {
    this.orgSlug = orgSlug
    this.apiKey = apiKey
    this.logger = logger || console
    this.errorLogLevel = errorLogLevel
    if (getUserData) {
      this.getUserData = getUserData
    }

    validateLogLevel({ logger: this.logger, logLevel: this.errorLogLevel })
  }

  getMultiOrgUserOrganizationPermissions (...args) {
    return Permissions.getMultiOrgUserOrganizationPermissions.call(
      this,
      ...args
    )
  }

  validateSomePermissionCluster (...args) {
    return Permissions.validateSomePermissionClusterMiddleware.call(
      this,
      ...args
    )
  }

  /**
   *
   * @param {PermissionMiddlewareOptions} options
   * @returns {Middleware}
   */
  middleware (options = null) {
    return async (req, res, next) => {
      try {
        const token = this.#getTokenFromRequest(req)

        if (!token) {
          throw new Error(
            'Missing authentication headers (Authorization or BearerStatic) or token (from body)'
          )
        }

        const permissionsToValidate = this.#getPermissionsToValidate(options)
        const permissionsToFetch = this.getPermissionsToFetch(options)
        const includePermissions =
          this.#getIncludePermissionParam(permissionsToFetch)

        const user = await this.getUserData({
          token,
          orgSlug: req.params.orgSlug || this.orgSlug,
          includePermissions
        })

        req.user = user

        if (permissionsToValidate?.length) {
          const permissionsResult = this.validateSomePermissionCluster(
            permissionsToValidate
          )(req, res)
          if (!permissionsResult) {
            throw new Error('Insufficient permissions or user is null')
          }
        }

        next()
      } catch (err) {
        this.logger[this.errorLogLevel](`${logModule}`, parseAxiosError(err))

        if (res.headersSent) {
          return
        }

        let code = 500
        const errorMessage =
          err?.response?.data?.message ||
          err?.response?.data.error ||
          err?.response?.data ||
          err?.message ||
          ''
        if (
          errorMessage?.includes?.('Invalid token') ||
          errorMessage?.includes?.('Missing authentication') ||
          errorMessage?.includes?.('Decoding Firebase ID') ||
          errorMessage?.includes?.('Firebase ID token has expired') ||
          errorMessage?.includes?.('Invalid recaptcha token')
        ) {
          code = 401
        } else if (
          errorMessage?.includes?.('Insufficient permissions or user is null')
        ) {
          code = 403
        }

        res.status(code).send(err?.response?.data || errorMessage)
      }

      return null
    }
  }

  /**
   * @param {PermissionMiddlewareOptions} options
   * @returns {string[]}
   */
  getPermissionsToFetch (options) {
    if (options === null) {
      return null
    }
    if (Array.isArray(options)) {
      return flattenDeep(options)
    }

    if (typeof options !== 'object') {
      throw new Error(
        'Invalid permissions argument. Must be an object or an array of strings.'
      )
    }

    const { permissionsToFetch = [], permissionsToValidate = [] } = options

    const permissionsToValidateList = flattenDeep(permissionsToValidate)

    const allPermissionsToFetch = [
      ...permissionsToValidateList,
      ...permissionsToFetch
    ]

    const uniquePermissions = uniq(allPermissionsToFetch)

    const validPermissions = uniquePermissions.filter(
      permission => typeof permission === 'string' && !!permission
    )

    return validPermissions
  }

  /**
   * @param {PermissionMiddlewareOptions} options
   * @returns {import('./permissions').Validators | null}
   */
  #getPermissionsToValidate (options = null) {
    if (options === null) {
      return null
    }

    if (Array.isArray(options)) {
      return options
    }

    if (typeof options !== 'object') {
      throw new Error(
        'Invalid permissions argument. Must be an object or an array of strings.'
      )
    }

    return options?.permissionsToValidate || null
  }

  /**
   * @description Returns the includePermissions parameter to be used in the
   * getUserData method depending on the permissionsToFetch argument. If the
   * permissionsToFetch argument is null, it returns true to fetch all
   * permissions. If the permissionsToFetch argument is an empty array, it
   * returns false to fetch no permissions. If the permissionsToFetch argument
   * is an array with permissions, it returns the array with the permissions to
   * fetch. If the permissionsToFetch argument is invalid, it returns true to
   * fetch all permissions.
   *
   * @private
   * @param {string[]} permissionsToFetch
   * @returns
   */
  #getIncludePermissionParam (permissionsToFetch) {
    if (permissionsToFetch === null) {
      // No argument provided, fetch all permissions
      return true
    }

    if (permissionsToFetch.length === 0) {
      // Fetch no permissions
      return false
    }

    if (permissionsToFetch.length > 0) {
      // Fetch only the permissions that are required
      return permissionsToFetch
    }

    this.logger[this.errorLogLevel](
      'Invalid permissionsToFetch argument, returning all permissions',
      { permissionsToFetch }
    )

    return true
  }

  #getTokenFromRequest (req) {
    if (!req) {
      throw new Error('Request object "req" is required')
    }

    if (req.headers?.authorization) {
      return `${req.headers.authorization}`
    }

    if (req.headers?.bearerstatic) {
      return `BearerStatic ${req.headers.bearerstatic}`
    }

    return req?.body?.token
  }
}

exports.quotiAuth = new QuotiAuth()
exports.permissions = Permissions
exports.QuotiAuth = QuotiAuth
