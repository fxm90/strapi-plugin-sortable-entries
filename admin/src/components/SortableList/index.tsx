import { DragDropProvider } from '@dnd-kit/react';

import { Typography } from '@strapi/design-system';
import { Drag } from '@strapi/icons';

import styled from 'styled-components';

import SortableListItem from '../SortableListItem';
import SortableListItemLayout from '../SortableListItemLayout';

//
// Types
//

import type { DragEndEvent, SortableList } from '../../types';

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

const FadeableList = styled.ul<{ $disabled: boolean }>`
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
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
  return (
    <Container>
      <DragDropProvider
        onDragEnd={({ canceled, operation }) => {
          if (canceled || !operation) {
            return;
          }

          // @ts-expect-error
          //
          // Implementation based on the official dnd-kit documentation:
          // https://dndkit.com/react/guides/sortable-state-management/#single-list-without-the-move-helper
          //
          // However, these docs don't include the `sortable` property in the TypeScript types.
          // The maintainer confirmed `source.sortable.initialIndex` / `source.sortable.index` as the correct API in:
          // https://github.com/clauderic/dnd-kit/issues/1664
          const { sortable } = operation.source;

          // Unfortunately we can't import `isSortable` from '@dnd-kit/react/sortable', due to a runtime error in the Strapi admin panel.
          // Therefore, we do a manual check to ensure this is a sortable event before accessing the sortable properties.
          // https://dndkit.com/react/guides/sortable-state-management/#issortable
          if (
            !sortable ||
            !('index' in sortable) ||
            !(typeof sortable.index === 'number') ||
            !('initialIndex' in sortable) ||
            !(typeof sortable.initialIndex === 'number')
          ) {
            return;
          }

          onDragEnd(sortable.initialIndex, sortable.index);
        }}
      >
        <SortableListItemLayout>
          <Drag fill="neutral600" />
          <Typography variant="sigma" textColor="neutral600">
            {heading}
          </Typography>
        </SortableListItemLayout>
        <FadeableList $disabled={disabled}>
          {list.map((listItem, index) => (
            <SortableListItem
              key={listItem.id}
              id={listItem.id}
              index={index}
              label={listItem.label}
              disabled={disabled}
            />
          ))}
        </FadeableList>
      </DragDropProvider>
    </Container>
  );
};

export default SortableList;
