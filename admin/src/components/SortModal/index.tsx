import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useNotification, useQueryParams } from '@strapi/strapi/admin';
import { Button, IconButton, Modal } from '@strapi/design-system';
import { Drag } from '@strapi/icons';

import { AsyncStatus } from '../../constants';
import { useFormatters } from '../../hooks/useFormatters';
import SortModalBody from '../SortModalBody';

import { useFetchEntries } from './useFetchEntries';
import { useSubmitEntries } from './useSubmitEntries';

//
// Types
//

import type { UID } from '@strapi/strapi';
import type { Entries, FetchEntriesState, DragEndEvent, UniqueIdentifier } from '../../types';

//
// Components
//

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
  const locale = queryParams.query.plugins.i18n.locale;

  /** The resolved entries are a mutable version of the fetched entries, which can be updated via drag-and-drop. */
  const [resolvedEntries, setResolvedEntries] = useState<Entries>([]);
  const { fetchEntriesState, fetchEntries, resetFetchEntriesState } = useFetchEntries({
    uid,
    mainField,
    filters,
    locale,
  });
  const { submitEntriesState, submitEntries, resetSubmitEntriesState } = useSubmitEntries({
    uid,
    filters,
    locale,
  });

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
      setResolvedEntries([]);
    }
  }, [isOpen, resetFetchEntriesState, resetSubmitEntriesState]);

  // Sync the resolved entries with the fetched entries on success.
  useEffect(() => {
    if (fetchEntriesState.status === AsyncStatus.Success) {
      setResolvedEntries(fetchEntriesState.data);
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
      // - Note: The functional update form of `setSearchParams` is used intentionally here to avoid adding `searchParams` to the dependency array,
      //         which would cause this effect to re-run on every search-param change (including the one we trigger below).
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
   * The callback for the drag-end event.
   *
   * - See also: https://docs.dndkit.com/presets/sortable
   *
   * - Note: We wrap the function in `useCallback` to ensure a stable function identity across renders.
   *         This prevents unnecessary re-renders or effect re-executions in components that depend on this function.
   */
  const handleDragEnd: DragEndEvent = useCallback(
    (activeID: UniqueIdentifier, overID: UniqueIdentifier) => {
      setResolvedEntries((resolvedEntries) => {
        if (resolvedEntries.length === 0) {
          console.error('Received a drag end event, but the list of entries is empty.');
          return resolvedEntries;
        }

        const oldIndex = resolvedEntries.findIndex((entry) => entry.documentId === activeID);
        const newIndex = resolvedEntries.findIndex((entry) => entry.documentId === overID);

        if (oldIndex === -1 || newIndex === -1) {
          console.error('Failed to find the dragged item in the list of entries.');
          return resolvedEntries;
        }

        return arrayMove(resolvedEntries, oldIndex, newIndex);
      });
    },
    []
  );

  /**
   * The callback for the submit event.
   *
   * - Note: We wrap the function in `useCallback` to ensure a stable function identity across renders.
   *         This prevents unnecessary re-renders or effect re-executions in components that depend on this function.
   */
  const handleSubmit = useCallback(() => {
    const sortedDocumentIds = resolvedEntries.map((entry) => entry.documentId);
    submitEntries(sortedDocumentIds);
  }, [resolvedEntries, submitEntries]);

  // Override the fetch state's data with `resolvedEntries` so that drag-and-drop reordering is immediately reflected in the UI.
  // `fetchEntriesState.data` is immutable after fetching, while `resolvedEntries` tracks the user's in-progress edits.
  //
  // - Note: We wrap the value in `useMemo` to avoid creating a new object on every render,
  //         which would cause `<SortModalBody />` to always receive a new reference.
  const displayFetchState: FetchEntriesState = useMemo(
    () =>
      fetchEntriesState.status === AsyncStatus.Success
        ? { status: AsyncStatus.Success, data: resolvedEntries }
        : fetchEntriesState,
    [fetchEntriesState, resolvedEntries]
  );

  const isSubmitting = submitEntriesState.status === AsyncStatus.InProgress;
  const isFetching = fetchEntriesState.status === AsyncStatus.InProgress;
  const isSubmitButtonDisabled = isSubmitting || isFetching || resolvedEntries.length === 0;

  return (
    <Modal.Root open={isOpen} onOpenChange={setIsOpen}>
      <Modal.Trigger>
        <IconButton label={translate('open-modal-button.label')}>
          <Drag />
        </IconButton>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>{translate('title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SortModalBody
            fetchEntriesState={displayFetchState}
            mainField={mainField}
            handleDragEnd={handleDragEnd}
            disabled={isSubmitting}
          />
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary">{translate('cancel-button.title')}</Button>
          </Modal.Close>
          <Button
            type="submit"
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
