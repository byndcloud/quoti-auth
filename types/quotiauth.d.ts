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
     * @param {String} orgSlug - Organization slug
     * @param {String} apiKey - Quoti API key
     * @param {Function} [getUserData] - function that returns user data
     * @param {Object} [logger] - Winston logger
     */
    constructor(orgSlug: string, apiKey: string, getUserData?: Function, logger?: any);
    /**
     * @param {Object} param0
     * @param {string} param0.token
     * @param {string} param0.orgSlug
     * @returns {Promise<import('../types/user').UserData | string>}
     */
    getUserData({ token, orgSlug }: {
        token: string;
        orgSlug: string;
    }): Promise<import('../types/user').UserData | string>;
    /**
     * @description Setups the orgSlug and apiKey
     * @param {Object} params - { orgSlug, apiKey, getUserData, logger }
     * @param {String} params.orgSlug - Organization slug
     * @param {String} params.apiKey - Quoti API key
     * @param {Function} [params.getUserData] - function that returns user data
     * @param {Object} [params.logger] - Winston logger
     */
    setup({ orgSlug, apiKey, getUserData, logger }: {
        orgSlug: string;
        apiKey: string;
        getUserData?: Function;
        logger?: any;
    }): void;
    orgSlug: string;
    apiKey: string;
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