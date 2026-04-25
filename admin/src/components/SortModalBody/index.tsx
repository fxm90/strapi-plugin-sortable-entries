import { EmptyStateLayout, Loader } from '@strapi/design-system';

import { AsyncStatus } from '../../constants';
import { useFormatters } from '../../hooks/useFormatters';
import { assertNever } from '../../utils/assertNever';
import SortableListComponent from '../SortableList';

//
// Types
//

import type { DragEndEvent, FetchEntriesState, SortableList } from '../../types';

//
// Components
//

/**
 * Returns different elements for the modal body, depending on the current fetch status.
 *
 * @param fetchEntriesState - The state for fetching the entries.
 * @param mainField - The displayed field of each entry in the collection type.
 * @param handleDragEnd - The event handler that is called on drag end.
 * @param disabled - Boolean flag whether sorting is disabled.
 */
const SortModalBody = ({
  fetchEntriesState,
  mainField,
  handleDragEnd,
  disabled,
}: {
  fetchEntriesState: FetchEntriesState;
  mainField: string;
  handleDragEnd: DragEndEvent;
  disabled: boolean;
}) => {
  const { translate } = useFormatters();

  switch (fetchEntriesState.status) {
    case AsyncStatus.Initial:
    case AsyncStatus.InProgress:
      return <Loader />;

    case AsyncStatus.Failed:
      return <EmptyStateLayout content={translate('empty-state.failure')} />;

    case AsyncStatus.Success: {
      const entries = fetchEntriesState.data;
      if (entries.length === 0) {
        return <EmptyStateLayout content={translate('empty-state.noContent')} />;
      }

      // Converts the data-models into view-models for the `<SortableList />` component.
      const sortableList: SortableList = entries.map((entry) => ({
        id: entry.documentId,
        // Use `!= null` (loose equality) to guard against both `null` and `undefined`,
        // since `entry[mainField]` is typed as `unknown` and could be either.
        // `String(undefined)` would otherwise render as the literal string "undefined".
        label: entry[mainField] != null ? String(entry[mainField]) : entry.documentId,
      }));

      return (
        <SortableListComponent
          list={sortableList}
          onDragEnd={handleDragEnd}
          disabled={disabled}
          heading={mainField}
        />
      );
    }

    default:
      return assertNever(fetchEntriesState);
  }
};

export default SortModalBody;
