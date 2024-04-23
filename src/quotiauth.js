const { flattenDeep } = require('lodash')
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
    includePermissions = encodeURIComponent(JSON.stringify(includePermissions))
    const { data } = await axios.post(
      `${url}${orgSlug || this.orgSlug}/auth/login/getuser?includePermissions=${includePermissions}`,
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
   * @param {import('./permissions').Validators} permissions
   * @returns {Middleware}
   */
  middleware (permissions = null) {
    return async (req, res, next) => {
      try {
        let token = req?.body?.token
        if (req.headers.bearerstatic) {
          token = `BearerStatic ${req.headers.bearerstatic}`
        }
        if (req.headers.authorization) {
          token = `${req.headers.authorization}`
        }

        if (!token) {
          throw new Error('Missing authentication')
        }

        let includePermissions = true

        if (permissions && Array.isArray(permissions)) {
          includePermissions =
            permissions.length !== 0 ? flattenDeep(permissions) : false
        }

        const result = await this.getUserData({
          token,
          orgSlug: req.params.orgSlug || this.orgSlug,
          includePermissions
        })

        req.user = result
        if (permissions && permissions.length) {
          const permissionsResult = this.validateSomePermissionCluster(
            permissions
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
          err?.response?.data ||
          err?.message ||
          ''
        if (
          errorMessage?.includes?.('Missing authentication') ||
          errorMessage?.includes?.('Decoding Firebase ID') ||
          errorMessage?.includes?.('Firebase ID token has expired')
        ) {
          code = 401
        } else if (
          errorMessage?.includes?.('Insufficient permissions or user is null')
        ) {
          code = 403
        } else if (errorMessage?.includes?.('Invalid recaptcha token')) {
          code = 401
        }

        res.status(code).send(err?.response?.data || errorMessage)
      }

      return null
    }
  }
}

exports.quotiAuth = new QuotiAuth()
exports.permissions = Permissions
exports.QuotiAuth = QuotiAuth
