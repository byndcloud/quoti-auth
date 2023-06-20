const { uniqBy } = require('lodash')
const { typeCheck } = require('type-check')

/**
 * Get the permissions that a multi organization user has within an organization
 * @param {String} slug Organization's slug to get permissions
 */
function getMultiOrgUserOrganizationPermissions (slug, permissions) {
  const organizationPermissions = []
  try {
    // For each api key environment
    for (const apiKeyEnvironment in permissions) {
      this.logger.debug('Api key environment:', { apiKeyEnvironment })

      this.logger.debug(
        'Granted permissions are:',
        permissions[apiKeyEnvironment]
      )

      // If environment is a regular expression
      if (
        apiKeyEnvironment.startsWith('/') &&
          apiKeyEnvironment.endsWith('/')
      ) {
        this.logger.debug('Will try to match with', { slug })

        // If matchs with organization slug, push permissions (will match /.*/ with any or no organization)
        if (slug.match(new RegExp(apiKeyEnvironment.slice(1, -1), 'g'))) {
          this.logger.debug("It's a match! Pushing permissions")

          organizationPermissions.push(...permissions[apiKeyEnvironment])
        }
      } else {
        this.logger.debug('Will try to compare with', { slug })

        // If it's a simple string, and is equal to the organization slug, push permissions
        if (apiKeyEnvironment === slug) {
          this.logger.debug('Sucess! Pushing permissions', { slug })

          organizationPermissions.push(...permissions[apiKeyEnvironment])
        }
      }
    }
  } catch (err) {
    this.logger.error(err)
  }

  return organizationPermissions
}

/**
 * @typedef {(RegExp | string)[][]} Validators
 */
/**
 * @callback ValidatorsGenerator
 * @param {import('express').Request} req
 * @returns {Validators}
 */
/**
 * @typedef {Validators | ValidatorsGenerator} ValidatorsOrValidatorsGenerator
 */

/**
 * Permission middleware factory
 * @param {ValidatorsOrValidatorsGenerator} validatorsOrFunction
 * @returns {import('./quotiauth').Middleware} A middleware that checks if the user in req.user has the permissions
 * to continue the request to the next handler.
 */
function validateSomePermissionClusterMiddleware (validatorsOrFunction = []) {
  const validatorsOrFunctionType = typeof validatorsOrFunction
  if (
    validatorsOrFunctionType !== 'function' &&
      typeCheck('[[String | RegExp]]', validatorsOrFunction) === false
  ) {
    const error = new Error(
        `Invalid permissions argument type (${validatorsOrFunctionType}) should be (string | RegExp)[][], a function that returns (string | RegExp)[][] or undefined`
    )
    throw error
  }
  return (req, res, next) => {
    if (!req.user) {
      if (next) {
        next()
      }
      return null
    }

    const validators =
        validatorsOrFunctionType === 'function'
          ? validatorsOrFunction(req)
          : validatorsOrFunction

    if (typeCheck('[[String | RegExp]]', validators) === false) {
      const error = new Error(
          `Invalid permissions argument type (${typeof validators}): should be either (RegExp | string)[][], a function that returns (RegExp | string)[][] or undefined.`
      )
      next(error)
      return false
    }

    // Pass test if no permission is required
    if (validators.length === 0) {
      this.logger.debug('User passed permission test')
      if (next) {
        next()
      }
      return true
    }

    const validatedPermissions = validateSomePermissionCluster.call(this,
      validators,
      req.user,
      req.params.orgSlug || '',
      !!req.get('ApiKey')
    )

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
      this.logger.error(error)
      return res.status(403).send(error)
    }
  }
}

/**
 * @typedef Permission
 * @property {number} id The ID of the permission in the database
 * @property {string} name The name of the permission
 */

/**
 * @typedef PermissionClusterValidationResult
 * @property {"intersection"|"expression"} by The form of validation used
 * @property {RegExp} [expression] The regex used to validate the permissions (only present when `by = 'expression'`)
 * @property {Permission[]} match The permissions matched by the regex (only present when `by = 'expression'`)
 * @property {Permission[]} intersection The permissions that the user has and that were requested (only present when `by = 'intersection'`)
 */

/**
 * @callback PermissionClusterValidatorFunction
 * @param {Validators} validators The validators to use against the user's permissions
 * @param {import('../types/user').UserData} user The user to validate
 * @param {string} orgSlug The organization slug of the user
 * @param {boolean} isApiKey Whether the user is using an api key to authenticate itself
 * @returns {PermissionClusterValidationResult[]}
 */

/**
 * This is a factory that receives a logger and returns a funcion that validates
 * user's permissions. The returned function receives an array of validators,
 * and tries to validate some of them, i.e., each validator can be an array or a
 * regular expression. When it's an array, the validator requires the user to
 * have all of its permissions. When it's a regular expression, the validator
 * requires some user permission to match it.
 * @param {*} logger
 * @returns {PermissionClusterValidatorFunction}
 */
function validateSomePermissionCluster (validators = [], user, orgSlug = '', usingApiKey = false) {
  // If auth method is api key
  if (usingApiKey) {
    const apiKeyPermissions = getMultiOrgUserOrganizationPermissions.call(this,
      orgSlug,
      user.permissions
    )

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

module.exports = {
  validateSomePermissionClusterMiddleware,
  validateSomePermissionCluster,
  getMultiOrgUserOrganizationPermissions
}
