const { uniqBy } = require('lodash')

/**
 * Get the permissions that a multi organization user has within an organization
 * @param {String} slug Organization's slug to get permissions
 */
function getMultiOrgUserOrganizationPermissions (logger) {
  return (slug, permissions) => {
    const organizationPermissions = []
    try {
      // For each api key environment
      for (const apiKeyEnvironment in permissions) {
        logger.verbose('Api key environment:', { apiKeyEnvironment })

        logger.verbose(
          'Granted permissions are:',
          permissions[apiKeyEnvironment]
        )

        // If environment is a regular expression
        if (
          apiKeyEnvironment.startsWith('/') &&
          apiKeyEnvironment.endsWith('/')
        ) {
          logger.verbose('Will try to match with', { slug })

          // If matchs with organization slug, push permissions (will match /.*/ with any or no organization)
          if (slug.match(new RegExp(apiKeyEnvironment.slice(1, -1), 'g'))) {
            logger.verbose("It's a match! Pushing permissions")

            organizationPermissions.push(...permissions[apiKeyEnvironment])
          }
        } else {
          logger.verbose('Will try to compare with', { slug })

          // If it's a simple string, and is equal to the organization slug, push permissions
          if (apiKeyEnvironment === slug) {
            logger.verbose('Sucess! Pushing permissions', { slug })

            organizationPermissions.push(...permissions[apiKeyEnvironment])
          }
        }
      }
    } catch (err) {
      logger.error(err)
    }

    return organizationPermissions
  }
}

/**
 * Permission middleware factory
 * @param {*} logger
 * @returns A middleware that checks if the user in req.user has the permissions
 * to continue the request to the next handler.
 */
function validateSomePermissionClusterMiddleware (logger) {
  return validators => {
    return (req, res, next) => {
      if (!req.user) {
        if (next) {
          next()
        }
        return null
      }
      // logger.profile('MiddlewarePermissions', { level: 'verbose' })

      // logger.debug('Requiring access', { url: req.originalUrl })

      // logger.debug('Validators are', [validators])

      // Pass test if no permission required
      if (validators.length === 0) {
        logger.debug('User passed permission test')
        if (next) {
          next()
        }
        return true
      }

      const validatedPermissions = validateSomePermissionCluster(logger)(validators, req.user, req.params.orgSlug, !!req.get('ApiKey'))

      // If some validator was validated, pass test
      if (validatedPermissions.length > 0) {
        req.permissions = {
          validated: validatedPermissions
        }
        if (next) {
          next()
        }
        return true
      } else {
        const error = new Error(
          `Insufficient permissions! Permissions ${validators.join(
            ', '
          )} are required`
        )
        logger.error(error)
        return res.status(403).send(error)
      }
    }
  }
}

/**
 * @typedef Permission
 * @property {number} id The ID of the permission in the database
 * @property {string} name The name of the permission
 */

/**
 * @typedef PermissionClusterValidation
 * @property {"intersection"|"expression"} by The form of validation used
 * @property {RegExp} [expression] The regex used to validate the permissions (only present when `by = 'expression'`)
 * @property {Permissions[]} match The permissions matched by the regex (only present when `by = 'expression'`)
 * @property {Permissions[]} intersection The permissions that the user has and that were requested (only present when `by = 'intersection'`)
 */

/**
 * This function receives an array of validators, and tries to validate some of
 * them, i.e., each validator can be an array or a regular expression. When it's
 * an array, the validator requires the user to have all of its permissions.
 * When it's a regular expression, the validator requires some user permission
 * to match it.
 * @param {string[][]|RegExp>} validators Validators
 * @param {any} user User to check permissions from.
 * @param {string} orgSlug The slug of the requested organization
 * @param {boolean} usingApiKey If the user is using an API key
 * @returns {PermissionClusterValidation[]}
 */
function validateSomePermissionCluster (logger) {
  return (validators = [], user, orgSlug, usingApiKey) => {
    // If auth method is api key
    if (usingApiKey) {
      const apiKeyPermissions = getMultiOrgUserOrganizationPermissions(
        logger
      )(orgSlug, user.permissions)

      // Push api key permissions to user permissions
      if (user.Permissions) {
        user.Permissions.push(...apiKeyPermissions)
      } else {
        user.Permissions = apiKeyPermissions
      }
    }

    const userPermissions = uniqBy(user.Permissions, 'name')
    const validatedPermissions = []

    for (const validator of validators) {
      if (validator instanceof Array) {
        // Get the intersection between users permissions and validator permissions
        const intersection = userPermissions.filter(userPermission =>
          validator.includes(userPermission.name)
        )

        // If the intersection is the validator itself, then the user has all the validator's permissions
        if (intersection.length === validator.length) {
          validatedPermissions.push({
            by: 'intersection',
            intersection
          })
        }
      } else if (validator instanceof RegExp) {
        // Try to match the user permissions with the validator
        const match = []

        for (const userPermission of userPermissions) {
          if (validator.test(userPermission.name)) {
            match.push(userPermission)
          }
        }

        // If some permission is validated, then the user matches the validator
        if (match.length > 0) {
          validatedPermissions.push({
            by: 'expression',
            expression: validator,
            match
          })
        }
      }
    }

    return validatedPermissions
  }
}

module.exports = {
  validateSomePermissionClusterMiddleware,
  validateSomePermissionCluster,
  getMultiOrgUserOrganizationPermissions
}
