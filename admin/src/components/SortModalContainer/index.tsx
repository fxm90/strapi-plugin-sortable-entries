// https://docs.strapi.io/dev-docs/migration/v4-to-v5/additional-resources/helper-plugin#usecmeditviewdatamanager
import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';

import { config } from '../../config';
import SortModal from '../SortModal';

//
// Components
//

/**
 * Returns the `<SortModal />` component if needed, meaning the current content type
 * supports sorting the entries and is correctly configured. Otherwise returns `null`.
 */
const SortModalContainer = () => {
  const { contentType, layout } = useContentManagerContext();
  if (!contentType) {
    return null;
  }

  const { attributes } = contentType;
  if (!(config.sortOrderFieldName in attributes)) {
    return null;
  }

  const sortOrderFieldAttributes = attributes[config.sortOrderFieldName];
  if (sortOrderFieldAttributes.type !== config.sortOrderFieldType) {
    console.warn(`${config.sortOrderFieldName} needs to be of type ${config.sortOrderFieldType}.`);
    return null;
  }

  const { uid } = contentType;
  const { mainField } = layout.list.settings;

  return <SortModal uid={uid} mainField={mainField} />;
};

export default SortModalContainer;
