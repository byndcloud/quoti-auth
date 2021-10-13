const axios = require('axios')
const Permissions = require('./permissions')
class QuotiAuth {
  constructor (orgSlug, apiKey, getUserData, logger) {
    this.setup({ orgSlug, apiKey, getUserData, logger })
  }

  async getUserData ({ token, orgSlug }) {
    const url = 'https://api.quoti.cloud/api/v1/'
    const headers = {
      ApiKey: this.apiKey
    }
    // console.log('fazendo com o token',token)
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
  getOrganizationalUserOrganizationPermissions (...args) {
    return Permissions.getOrganizationalUserOrganizationPermissions(
      this.logger
    )(...args)
  }

  validateSomePermissionCluster (...args) {
    return Permissions.validateSomePermissionCluster(this.logger)(...args)
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
        if (res.headersSent) {
          return
        }

        let code = 500
        if (
          err?.message === 'Missing authentication' ||
          err?.response?.data?.includes('Decoding Firebase ID')
        ) {
          code = 401
        } else if (
          err?.message === 'Insufficient permissions or user is null'
        ) {
          code = 403
        }
        res.status(code).send(err?.response?.data || err)
      }
      return null
    }
  }
}

exports.quotiAuth = new QuotiAuth()
