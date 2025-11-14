import { EmptyStateLayout, Loader } from '@strapi/design-system';

import { useIntl } from 'react-intl';

import { FetchStatus } from '../../constants';
import { prefixKey } from '../../utils/prefixKey';
import SortableListComponent from '../SortableList';

//
// Types
//

import type { DragEndEvent, EntriesFetchState, SortableList } from 'src/types';

//
// Components
//

/**
 * Returns different elements for the modal body, depending on the current fetch status.
 *
 * @param entriesFetchState - The state for fetching the entries.
 * @param mainField - The displayed field of each entry in the collection type.
 * @param handleDragEnd - The event handler that is called on drag end.
 * @param disabled - Boolean flag whether sorting is disabled.
 */
const SortModalBody = ({
  entriesFetchState,
  mainField,
  handleDragEnd,
  disabled,
}: {
  entriesFetchState: EntriesFetchState;
  mainField: string;
  handleDragEnd: DragEndEvent;
  disabled: boolean;
}) => {
  const { formatMessage } = useIntl();
  const translate = (key: string): string => formatMessage({ id: prefixKey(key) });

  switch (entriesFetchState.status) {
    case FetchStatus.Initial:
    case FetchStatus.Loading:
      return <Loader />;

    case FetchStatus.Failed:
      return <EmptyStateLayout content={translate('empty-state.failure')} />;

    case FetchStatus.Resolved:
      const entries = entriesFetchState.value;
      if (entries.length === 0) {
        return <EmptyStateLayout content={translate('empty-state.noContent')} />;
      }

      // Converts the data-models into view-models for the `<SortableList />` component.
      const sortableList: SortableList = entries.map((entry) => ({
        id: entry.documentId,
        label: entry[mainField],
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
};

export default SortModalBody;
