export type Validators = (RegExp | string)[][];
export type ValidatorsGenerator = (req: import('express').Request) => Validators;
export type ValidatorsOrValidatorsGenerator = (string | RegExp)[][] | ValidatorsGenerator;
export type Permission = {
    /**
     * The ID of the permission in the database
     */
    id: number;
    /**
     * The name of the permission
     */
    name: string;
};
export type PermissionClusterValidationResult = {
    /**
     * The form of validation used
     */
    by: "intersection" | "expression";
    /**
     * The regex used to validate the permissions (only present when `by = 'expression'`)
     */
    expression?: RegExp;
    /**
     * The permissions matched by the regex (only present when `by = 'expression'`)
     */
    match: Permissions[];
    /**
     * The permissions that the user has and that were requested (only present when `by = 'intersection'`)
     */
    intersection: Permissions[];
};
export type PermissionClusterValidatorFunction = (validators: Validators, user: any, orgSlug: string, isApiKey: boolean) => PermissionClusterValidationResult;
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
 * @param {*} logger
 * @returns {import('./quotiauth').Middleware} A middleware that checks if the user in req.user has the permissions
 * to continue the request to the next handler.
 */
export function validateSomePermissionClusterMiddleware(logger: any): import('./quotiauth').Middleware;
/**
 * @typedef Permission
 * @property {number} id The ID of the permission in the database
 * @property {string} name The name of the permission
 */
/**
 * @typedef PermissionClusterValidationResult
 * @property {"intersection"|"expression"} by The form of validation used
 * @property {RegExp} [expression] The regex used to validate the permissions (only present when `by = 'expression'`)
 * @property {Permissions[]} match The permissions matched by the regex (only present when `by = 'expression'`)
 * @property {Permissions[]} intersection The permissions that the user has and that were requested (only present when `by = 'intersection'`)
 */
/**
 * @callback PermissionClusterValidatorFunction
 * @param {Validators} validators The validators to use against the user's permissions
 * @param {} user The user to validate
 * @param {string} orgSlug The organization slug of the user
 * @param {boolean} isApiKey Whether the user is using an api key to authenticate itself
 * @returns {PermissionClusterValidationResult}
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
export function validateSomePermissionCluster(logger: any): PermissionClusterValidatorFunction;
/**
 * Get the permissions that a multi organization user has within an organization
 * @param {String} slug Organization's slug to get permissions
 */
export function getMultiOrgUserOrganizationPermissions(logger: any): (slug: any, permissions: any) => any[];
//# sourceMappingURL=permissions.d.ts.map