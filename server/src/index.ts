/**
 * Application methods
 */
import bootstrap from './bootstrap';
import destroy from './destroy';
import register from './register';

/**
 * Plugin server methods
 */

// We explicitly need to append `/index` here to load the plugin configuration and
// not our static configuration (which is not merged with the user configuration).
import config from './config/index';
import contentTypes from './content-types';
import controllers from './controllers';
import middlewares from './middlewares';
import policies from './policies';
import routes from './routes';
import services from './services';

export default {
  register,
  bootstrap,
  destroy,
  config,
  controllers,
  routes,
  services,
  contentTypes,
  policies,
  middlewares,
};
