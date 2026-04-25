import { Flex } from '@strapi/design-system';

//
// Types
//

import type { PropsWithChildren } from 'react';

//
// Components
//

/**
 * A layout wrapper component designed for use within the sortable list UI.
 * It helps to ensure sortable list items have uniform spacing and layout alignment.
 */
const SortableListItemLayout = ({ children }: PropsWithChildren) => (
  <Flex gap={4} marginTop={4} marginBottom={4} marginRight={5} marginLeft={5}>
    {children}
  </Flex>
);

export default SortableListItemLayout;
