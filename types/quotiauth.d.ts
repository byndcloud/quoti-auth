export const quotiAuth: QuotiAuth;
export type Middleware = (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => any;
/**
   * @callback Middleware
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
export class QuotiAuth {
    /**
     * @description Setups the orgSlug and apiKey
     * @param {Object} - { orgSlug, apiKey, getUserData, logger }
     * @param {String} orgSlug - Organization slug
     * @param {String} apiKey - Quoti API key
     * @param {Function} [getUserData] - function that returns user data
     * @param {Function} [logger] - Winston logger
     */
    constructor(orgSlug: string, apiKey: string, getUserData?: Function, logger?: Function);
    getUserData({ token, orgSlug }: {
        token: any;
        orgSlug: any;
    }): Promise<any>;
    /**
     * @description Setups the orgSlug and apiKey
     * @param {Object} - { orgSlug, apiKey, getUserData, logger }
     * @param {String} orgSlug - Organization slug
     * @param {String} apiKey - Quoti API key
     * @param {Function} [getUserData] - function that returns user data
     * @param {Function} [logger] - Winston logger
     */
    setup({ orgSlug, apiKey, getUserData, logger }: any): void;
    orgSlug: any;
    apiKey: any;
    logger: any;
    getMultiOrgUserOrganizationPermissions(...args: any[]): any[];
    validateSomePermissionCluster(...args: any[]): any;
    /**
     *
     * @param {import('./permissions').Validators} permissions
     * @returns {Middleware}
     */
    middleware(permissions?: import('./permissions').Validators): Middleware;
}
import Permissions = require("./permissions");
export { Permissions as permissions };
//# sourceMappingURL=quotiauth.d.ts.map