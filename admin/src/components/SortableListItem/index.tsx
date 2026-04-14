import { useSortable } from '@dnd-kit/react/sortable';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';

import { Typography } from '@strapi/design-system';
import { Drag } from '@strapi/icons';

import styled from 'styled-components';

import SortableListItemLayout from '../SortableListItemLayout';

//
// Types
//

import type { UniqueIdentifier } from '../../types';

//
// Config
//

const config = {
  /** The modifiers to apply to the sortable item. */
  modifiers: [RestrictToVerticalAxis],

  /** The z-index to apply when the item is being dragged. */
  zIndex: 1000,
};

//
// Components
//

/**
 * A list item showing a divider at the top.
 *
 * - See also: https://github.com/strapi/design-system/blob/main/packages/design-system/src/components/Table/Table.tsx
 */
const DividedListItem = styled.li`
  border-top: 1px solid ${({ theme }) => theme.colors.neutral150};
  background: ${({ theme }) => theme.colors.neutral0};
`;

/**
 * A single item in the sortable list.
 *
 * @param id - The unique identifier of the list item.
 * @param index - The position of the list item in the list.
 * @param label - The title to show in the list item.
 * @param disabled - Boolean flag whether sorting is disabled.
 */
const SortableListItem = ({
  id,
  index,
  label,
  disabled,
}: {
  id: UniqueIdentifier;
  index: number;
  label: string;
  disabled: boolean;
}) => {
  const sortable = useSortable({ id, index, disabled, modifiers: config.modifiers });

  return (
    <DividedListItem
      ref={sortable.ref}
      style={sortable.isDragging ? { position: 'relative', zIndex: config.zIndex } : undefined}
    >
      <SortableListItemLayout>
        <Drag style={{ cursor: 'grab' }} />
        <Typography variant="omega">{label}</Typography>
      </SortableListItemLayout>
    </DividedListItem>
  );
};

export default SortableListItem;
