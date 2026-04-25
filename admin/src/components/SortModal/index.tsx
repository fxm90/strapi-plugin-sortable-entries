import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useNotification, useQueryParams } from '@strapi/strapi/admin';
import { Button, EmptyStateLayout, IconButton, Loader, Modal } from '@strapi/design-system';
import { Drag } from '@strapi/icons';

import { AsyncStatus } from '../../constants';
import { useFormatters } from '../../hooks/useFormatters';
import { assertNever } from '../../utils/assertNever';
import SortableListComponent from '../SortableList';

import { useFetchEntries } from './useFetchEntries';
import { useSubmitEntries } from './useSubmitEntries';

//
// Types
//

import type { UID } from '@strapi/strapi';
import type { DragEndEvent, SortableList } from '../../types';

//
// Components
//

/**
 * Renders the body of the modal based on the fetch state.
 */
const SortModalBody = ({
  heading,
  fetchStatus,
  isEmpty,
  sortableList,
  onDragEnd,
  isSubmitting,
}: {
  heading: string;
  fetchStatus: AsyncStatus;
  isEmpty: boolean;
  sortableList: SortableList;
  onDragEnd: DragEndEvent;
  isSubmitting: boolean;
}) => {
  const { translate } = useFormatters();

  switch (fetchStatus) {
    case AsyncStatus.Initial:
    case AsyncStatus.InProgress:
      return <Loader />;

    case AsyncStatus.Failed:
      return <EmptyStateLayout content={translate('empty-state.failure')} />;

    case AsyncStatus.Success:
      if (isEmpty) {
        return <EmptyStateLayout content={translate('empty-state.noContent')} />;
      }

      return (
        <SortableListComponent
          list={sortableList}
          onDragEnd={onDragEnd}
          disabled={isSubmitting}
          heading={heading}
        />
      );

    default:
      return assertNever(fetchStatus);
  }
};

/**
 * A modal component that retrieves entries from the current collection type,
 * presents them in a sortable list, and enables saving changes via a submit button.
 *
 * @param uid - The unique identifier of the content type which entries are sorted.
 * @param mainField - The displayed field of each entry in the collection type.
 */
const SortModal = ({ uid, mainField }: { uid: UID.ContentType; mainField: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [, setSearchParams] = useSearchParams();

  const { toggleNotification } = useNotification();
  const { translate } = useFormatters();

  const [queryParams] = useQueryParams({
    filters: undefined,
    plugins: { i18n: { locale: undefined } },
  });

  const filters = queryParams.query.filters;
  const locale = queryParams.query.plugins?.i18n?.locale;

  const { fetchEntriesState, fetchEntries, resetFetchEntriesState } = useFetchEntries({
    uid,
    filters,
    locale,
  });
  const { submitEntriesState, submitEntries, resetSubmitEntriesState } = useSubmitEntries({
    uid,
    filters,
    locale,
  });

  /**
   * Working copy of the fetched entries as `{ id, label }` view-models, updated by drag-and-drop reordering.
   * Serves as the single source of truth for both rendering and submission.
   */
  const [sortableList, setSortableList] = useState<SortableList>([]);

  // Fetch the entries every time the modal is opened.
  useEffect(() => {
    if (isOpen) {
      fetchEntries();
    }
  }, [isOpen, fetchEntries]);

  // Reset all states to their initial values when the modal is closed, to prevent stale data the next time it is opened.
  //
  // - Note: Split into two separate effects (one for opening, one for closing), so each effect has a single responsibility
  //         and only depends on the functions it actually calls.
  useEffect(() => {
    if (!isOpen) {
      resetFetchEntriesState();
      resetSubmitEntriesState();
      setSortableList([]);
    }
  }, [isOpen, resetFetchEntriesState, resetSubmitEntriesState]);

  // Convert fetched entries to view-models and store them on success, keeping `fetchEntriesState.data` immutable after fetching.
  useEffect(() => {
    if (fetchEntriesState.status === AsyncStatus.Success) {
      const sortableList = fetchEntriesState.data.map((entry) => ({
        id: entry.documentId,
        // Use `!= null` (loose equality) to guard against both `null` and `undefined`,
        // since `entry[mainField]` is typed as `unknown` and could be either.
        // `String(undefined)` would otherwise render as the literal string "undefined".
        label: entry.mainField != null ? String(entry.mainField) : entry.documentId,
      }));
      setSortableList(sortableList);
    }
  }, [fetchEntriesState]);

  // Close pop-up and refresh list view after successful submission.
  useEffect(() => {
    if (submitEntriesState.status === AsyncStatus.Success) {
      setIsOpen(false);

      // Workaround to refresh only the list view without reloading the entire page:
      // Appends a timestamp-based query parameter to trigger a targeted refresh.
      //
      // - See also: https://stackoverflow.com/a/71466484
      //
      // - Note: The functional update form of `setSearchParams` is used intentionally here to avoid
      //         adding `searchParams` to the dependency array, which would cause this effect to re-run
      //         on every search-param change (including the one we trigger below).
      setSearchParams((prev) => {
        prev.set('t', String(Date.now()));
        return prev;
      });
    }
  }, [submitEntriesState, setSearchParams]);

  // Show a notification when the submission of the new sort order fails.
  //
  // - Note: We don't need to trigger a notification when the fetching of the entries fails,
  //         cause in that case we will show an error message in the modal itself.
  //         We therefore only trigger a notification for submission errors, which can e.g. happen
  //         when the entries of a filtered modal are outdated.
  useEffect(() => {
    if (submitEntriesState.status === AsyncStatus.Failed) {
      toggleNotification({
        type: 'danger',
        message: translate('notification.failure'),
      });
    }
  }, [submitEntriesState, toggleNotification, translate]);

  /**
   * Reorders `sortableList` by moving the dragged item from its old position to its new position.
   *
   * - Note: We wrap the function in `useCallback` to ensure a stable function identity across renders.
   *         This prevents unnecessary re-renders or effect re-executions in components that depend on this function.
   */
  const handleDragEnd: DragEndEvent = useCallback((oldIndex, newIndex) => {
    setSortableList((sortableList) => {
      if (oldIndex === newIndex) {
        return sortableList;
      }

      const isValidOldIndex = oldIndex >= 0 && oldIndex < sortableList.length;
      const isValidNewIndex = newIndex >= 0 && newIndex < sortableList.length;

      if (!isValidOldIndex || !isValidNewIndex) {
        console.error('Drag-end indices are out of bounds.', {
          oldIndex,
          newIndex,
          length: sortableList.length,
        });

        return sortableList;
      }

      // Move the dragged item to its new position.
      // https://dndkit.com/concepts/sortable/#single-list
      const newItems = [...sortableList];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      return newItems;
    });
  }, []);

  /**
   * The callback for the submit event.
   *
   * - Note: We wrap the function in `useCallback` to ensure a stable function identity across renders.
   *         This prevents unnecessary re-renders or effect re-executions in components that depend on this function.
   */
  const handleSubmit = useCallback(() => {
    const sortedDocumentIds = sortableList.map((item) => item.id);
    submitEntries(sortedDocumentIds);
  }, [sortableList, submitEntries]);

  // We explicitly derive `isEmpty` from `fetchEntriesState.data` instead of checking `sortableList.length === 0` to avoid a one-render flash:
  // `sortableList` is populated in a `useEffect` (which runs after paint), so on the first render after a successful fetch it is still an empty list,
  // which would briefly show the empty state or disable the submit button.
  const isSuccessfullyFetched = fetchEntriesState.status === AsyncStatus.Success;
  const isEmpty = isSuccessfullyFetched && fetchEntriesState.data.length === 0;

  const isSubmitting = submitEntriesState.status === AsyncStatus.InProgress;
  const isSubmitButtonDisabled = !isSuccessfullyFetched || isEmpty || isSubmitting;

  return (
    <Modal.Root open={isOpen} onOpenChange={setIsOpen}>
      <Modal.Trigger>
        <IconButton label={translate('open-modal-button.label')}>
          <Drag />
        </IconButton>
      </Modal.Trigger>
      {/* Prevent focus from returning to the trigger button on close, which would cause its tooltip to appear. */}
      <Modal.Content onCloseAutoFocus={(e: Event) => e.preventDefault()}>
        <Modal.Header>
          <Modal.Title>{translate('title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SortModalBody
            heading={mainField}
            fetchStatus={fetchEntriesState.status}
            isEmpty={isEmpty}
            sortableList={sortableList}
            onDragEnd={handleDragEnd}
            isSubmitting={isSubmitting}
          />
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary">{translate('cancel-button.title')}</Button>
          </Modal.Close>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitButtonDisabled}
            loading={isSubmitting}
          >
            {translate('submit-button.title')}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export default SortModal;
