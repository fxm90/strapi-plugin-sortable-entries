import { PLUGIN_ID } from './pluginId';
import Initializer from './components/Initializer';
import SortModalContainer from './components/SortModalContainer';

/**
 * The view of the injection zone.
 *
 * - See also: https://docs.strapi.io/cms/plugins-development/admin-panel-api#using-predefined-injection-zones
 */
const enum InjectionZoneView {
  editView = 'editView',
  listView = 'listView',
}

/**
 * The location of the injection zone.
 *
 * - Note: We're only using `listView` and therefore only specify the corresponding locations below.
 */
const enum InjectionZoneLocation {
  /** Sits between Filters and the cogs icon. */
  actions = 'actions',
}

export default {
  register(app: any) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  bootstrap(app: any) {
    app
      .getPlugin('content-manager')
      .injectComponent(InjectionZoneView.listView, InjectionZoneLocation.actions, {
        name: 'SortModalContainer',
        Component: SortModalContainer,
      });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
