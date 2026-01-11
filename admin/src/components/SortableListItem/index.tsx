import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Typography } from '@strapi/design-system';
import { Drag } from '@strapi/icons';

import styled from 'styled-components';

import SortableListItemLayout from '../SortableListItemLayout';

//
// Types
//

import type { UniqueIdentifier } from '../../types';

// Fixes the error "Property `colors` does not exist on type `DefaultTheme`" on the style below.
interface Theme {
  colors: {
    [key: string]: string | number;
  };
}

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
 * @param label - The title to show in the list item.
 */
const SortableListItem = ({ id, label }: { id: UniqueIdentifier; label: string }) => {
  // Based on:
  // https://docs.dndkit.com/presets/sortable
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  // Providing a dedicated type here fixes the error "Type `string` is not assignable to type `Position`".
  // https://stackoverflow.com/a/73946106
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    // Based on:
    // https://github.com/clauderic/dnd-kit/issues/1466
    position: isDragging ? 'relative' : 'inherit',
    zIndex: isDragging ? 1000 : 0,
  };

  return (
    <DividedListItem ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SortableListItemLayout>
        <Drag />
        <Typography variant="omega">{label}</Typography>
      </SortableListItemLayout>
    </DividedListItem>
  );
};

export default SortableListItem;
