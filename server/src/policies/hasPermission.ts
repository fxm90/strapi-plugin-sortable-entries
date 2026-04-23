//
// Types
//

/** The URL path parameters for the policy context. */
interface Params {
  uid?: string;
}

/**
 * Represents a CASL-style authorization ability used to determine whether a user is permitted to perform a specific action on a subject.
 * This follows the permission model used by CASL, which powers authorization in Strapi under the hood.
 */
interface UserAbility {
  can: (action: string, subject: string) => boolean;
}

/** The Koa context state containing the user's ability, populated by admin authentication middleware. */
interface State {
  userAbility?: UserAbility;
}

/** The policy configuration object. */
export interface PolicyConfig {
  actions?: string[];
}

//
// Policy
//

/**
 * Policy that checks whether the authenticated admin user has the required
 * content-manager permissions for the content type identified by `ctx.params.uid`.
 *
 * Configure via the route's `config.policies` with an `actions` array:
 *
 * ```ts
 * {
 *   name: 'plugin::document-metadata.hasPermission',
 *   config: { actions: ['plugin::content-manager.explorer.read'] },
 * }
 * ```
 *
 * Available actions are registered by Strapi's content-manager plugin:
 * https://github.com/strapi/strapi/blob/main/packages/core/content-manager/server/src/services/permission.ts
 */
const hasPermission = (ctx: Record<string, unknown>, config: PolicyConfig) => {
  const { uid } = ctx.params as Params;
  const { userAbility } = ctx.state as State;

  if (!uid || !userAbility) {
    return false;
  }

  const actions = config.actions ?? [];
  return actions.every((action) => userAbility.can(action, uid));
};

export default hasPermission;
