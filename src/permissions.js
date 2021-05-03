const uniqBy = require('lodash/uniqBy')

/**
 * @description Get permissions for a organization granted to organizational user
 * @param {String} slug Organization's slug to get permissions
 */
const getOrganizationalUserOrganizationPermissions = logger => {
  return (slug, permissions) => {
    const organizationPermissions = []
    try {
    // For each api key environment
      for (const apiKeyEnvironment in permissions) {
        logger.verbose('Api key environment:', { apiKeyEnvironment })

        logger.verbose('Granted permissions are:', permissions[apiKeyEnvironment])

        // If environment is a regular expression
        if (apiKeyEnvironment.startsWith('/') && apiKeyEnvironment.endsWith('/')) {
          logger.verbose('Will try to match with', { slug })

          // If matchs with organization slug, push permissions (will match /.*/ with any or no organization)
          if (slug.match(new RegExp(apiKeyEnvironment.slice(1, -1), 'g'))) {
            logger.verbose('It\'s a match! Pushing permissions')

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
 * @description Validate permissions
 * This function receives an array of validators, and tries to validate some of them, i.e.,
 * each validator can be an array or a regular expression. When it's an array, the
 * validator requires the user to have all of its permissions. When it's a regular
 * expression, the validator requires some user permission to match it.
 * @param {Array.<Array.<String>|RegExp>} validators Validators
 */
function validateSomePermissionCluster (logger) {
  return (validators = []) => {
    return (req, res, next) => {
      if (!req.user) {
        if (next) { next() }
        return null
      }
      logger.profile('MiddlewarePermissions', { level: 'verbose' })

      logger.info('Requiring access', { url: req.originalUrl })

      logger.info('Validators are', [validators])

      // Pass test if no permission required
      if (validators.length === 0) {
        logger.info('User passed permission test')
        if (next) { next() }
        return true
      }

      logger.info('Getting users permissions')

      // Get user permissions

      // If auth method is api key
      if (req.get('ApiKey')) {
        const orgSlug = req.params.orgSlug || ''

        const apiKeyPermissions = getOrganizationalUserOrganizationPermissions(logger)(orgSlug, req.user.permissions)

        // Push api key permissions to user permissions
        if (req.user.Permissions) {
          req.user.Permissions.push(...apiKeyPermissions)
        } else {
          req.user.Permissions = apiKeyPermissions
        }
      }

      const userPermissions = uniqBy(req.user.Permissions, 'name')
      req.permissions = {
        validated: []
      }

      for (const validator of validators) {
        if (validator instanceof Array) {
          // Get the intersection between users permissions and validator permissions
          const intersection = userPermissions.filter(userPermission => validator.includes(userPermission.name))

          // If the intersection is the validator itself, then the user has all the validator's permissions
          if (intersection.length === validator.length) {
            req.permissions.validated.push({
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

          // If some permission is validated, then the user matchs the validator
          if (match.length > 0) {
            req.permissions.validated.push({
              by: 'expression',
              expression: validator,
              match
            })
          }
        }
      }

      // If some validator were validated, pass test
      if (req.permissions.validated.length > 0) {
        logger.info('User passed permission test')
        if (next) { next() }
        return true
      } else {
        const error = new Error(`Insufficient permissions! Permissions ${validators.join(', ')} are required`)
        logger.error(error)
        res.status(401).send(error)
      }
    }
  }
}

module.exports = { validateSomePermissionCluster, getOrganizationalUserOrganizationPermissions }
