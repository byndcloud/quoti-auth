
const axios = require('axios')
const Permissions = require('./permissions')
class QuotiAuth {
  constructor (orgSlug, apiKey, getUserData, logger) {
    this.orgSlug = orgSlug
    this.apiKey = apiKey
    this.logger = logger
    if (getUserData) {
      this.getUserData = getUserData
    }
  }

  async getUserData (token) {
    const url = process.env['api_url'] || 'https://api.minhafaculdade.app/api/v1/'
    const headers = {
      ApiKey: this.apiKey
    }
    const { data } = await axios.post(`${url}${this.orgSlug}/auth/login/getuser`, { token }, { headers })
    return data?.user
  }

  setup ({ orgSlug, apiKey, getUserData, logger }) {
    this.orgSlug = orgSlug
    this.apiKey = apiKey
    this.logger = logger || console
    if (getUserData) {
      this.getUserData = getUserData
    }
  }
  getOrganizationalUserOrganizationPermissions (args) {
    return Permissions.getOrganizationalUserOrganizationPermissions(this.logger)(args)
  }

  validateSomePermissionCluster (args) {
    return Permissions.validateSomePermissionCluster(this.logger)(args)
  }

  /**
   * @description Sets req.user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  middleware (permissions = null) {
    return async (req, res, next) => {
      try {
        if (!req?.body) {
          throw new Error('You shold have a body parser in your express to parse the body of request.')
        }
        if (!req?.body?.token) {
          throw new Error('You shold have send a token in the body of request to search.')
        }
        const token = req?.body?.token

        const result = await this.getUserData(token)
        req.user = result
        if (permissions) {
          const permissionsResult = this.validateSomePermissionCluster(permissions)(req, res)
          if (!permissionsResult) {
            throw new Error('Insufficient permissions or user is null')
          }
        }

        next()
      } catch (err) {
        console.error(err)
        res.status(500).send('Error! See console for more.')
      }
      return null
    }
  }
}

exports.quotiAuth = new QuotiAuth()
