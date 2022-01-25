const axios = require('axios')
const Permissions = require('./permissions')
const axiosBetterStackTrace = require('axios-better-stacktrace').default
const AxiosError = require('axios-error')

axiosBetterStackTrace(axios)

class QuotiAuth {
  constructor (orgSlug, apiKey, getUserData, logger) {
    this.setup({ orgSlug, apiKey, getUserData, logger })
  }

  async getUserData ({ token, orgSlug }) {
    const url = 'https://api.quoti.cloud/api/v1/'
    const headers = {
      ApiKey: this.apiKey
    }

    const { data } = await axios.post(
      `${url}${orgSlug || this.orgSlug}/auth/login/getuser`,
      { token },
      { headers }
    )
    return data
  }

  setup ({ orgSlug, apiKey, getUserData, logger }) {
    this.orgSlug = orgSlug
    this.apiKey = apiKey
    this.logger = logger || console
    if (getUserData) {
      this.getUserData = getUserData
    }
  }

  getMultiOrgUserOrganizationPermissions (...args) {
    return Permissions.getMultiOrgUserOrganizationPermissions(this.logger)(
      ...args
    )
  }

  validateSomePermissionCluster (...args) {
    return Permissions.validateSomePermissionClusterMiddleware(this.logger)(
      ...args
    )
  }

  /**
   * @description Sets req.user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  middleware (permissions = null) {
    /**
     *
     * @param {*} req
     * @param {import('express').Response} res
     * @param {*} next
     * @returns
     */
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

        const result = await this.getUserData({
          token,
          orgSlug: req.params.orgSlug || this.orgSlug
        })
        req.user = result
        if (permissions) {
          const permissionsResult = this.validateSomePermissionCluster(
            permissions
          )(req, res)
          if (!permissionsResult) {
            throw new Error('Insufficient permissions or user is null')
          }
        }

        next()
      } catch (err) {
        this.logger.error(err.stack)
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
          this.logger.error('Axios error', new AxiosError(err))
        }
        res.status(code).send(err?.response?.data || errorMessage)
      }
      return null
    }
  }
}

exports.quotiAuth = new QuotiAuth()
exports.QuotiAuth = QuotiAuth
