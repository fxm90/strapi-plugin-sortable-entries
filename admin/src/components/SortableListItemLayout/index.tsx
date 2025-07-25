import { Box, Flex } from '@strapi/design-system';

/**
 * A layout wrapper component designed for use within the sortable list UI.
 * It helps to ensure sortable list items have uniform spacing and layout alignment.
 */
const SortableListItemLayout = ({ children }: React.PropsWithChildren) => (
  <Box marginTop={4} marginBottom={4} marginRight={5} marginLeft={5}>
    <Flex gap={4}>{children}</Flex>
  </Box>
);

export default SortableListItemLayout;
