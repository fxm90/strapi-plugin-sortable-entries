import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { Typography } from '@strapi/design-system';
import { Drag } from '@strapi/icons';

import styled from 'styled-components';

import SortableListItem from '../SortableListItem';
import SortableListItemLayout from '../SortableListItemLayout';

//
// Types
//

import type { DragEndEvent as DNDKitDragEndEvent } from '@dnd-kit/core';
import type { DragEndEvent, SortableList } from 'src/types';

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
 * The bordered container for the sortable list.
 *
 * - See also: https://github.com/strapi/design-system/blob/main/packages/design-system/src/components/Table/Table.tsx
 */
const Container = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  border-radius: 4px;
`;

const FadeableList = styled.ul<{ disabled: boolean }>`
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

/**
 * A sortable list.
 *
 * @param list - The list that should be sorted.
 * @param onDragEnd - The event handler that is called on drag end.
 * @param disabled - Boolean flag whether sorting is disabled.
 * @param heading - The heading displayed above the sortable list.
 */
const SortableList = ({
  list,
  onDragEnd,
  disabled,
  heading,
}: {
  list: SortableList;
  onDragEnd: DragEndEvent;
  disabled: boolean;
  heading: string;
}) => {
  // Based on:
  // https://docs.dndkit.com/presets/sortable
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DNDKitDragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    if (active.id === over.id) {
      return;
    }

    onDragEnd(active.id, over.id);
  };

  return (
    <Container>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={list} strategy={verticalListSortingStrategy} disabled={disabled}>
          <SortableListItemLayout>
            <Drag fill="neutral600" />
            <Typography variant="sigma" textColor="neutral600">
              {heading}
            </Typography>
          </SortableListItemLayout>
          <FadeableList disabled={disabled}>
            {list.map((listItem) => (
              <SortableListItem key={listItem.id} id={listItem.id} label={listItem.label} />
            ))}
          </FadeableList>
        </SortableContext>
      </DndContext>
    </Container>
  );
};

export default SortableList;
