import { arrayMove } from '@dnd-kit/sortable';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';

import { useFetchClient, useNotification, useQueryParams } from '@strapi/strapi/admin';
import { Button, IconButton, Modal } from '@strapi/design-system';
import { Drag } from '@strapi/icons';

import { FetchStatus } from '../../constants';
import { prefixKey } from '../../utils/prefixKey';
import SortModalBody from '../SortModalBody';

//
// Types
//

import type { UID } from '@strapi/strapi';
import type { Entries, DragEndEvent, EntriesFetchState, UniqueIdentifier } from 'src/types';

//
// Config
//

const config = {
  /** The configuration for the fetch entries request. */
  fetchEntriesRequest: {
    /** The path to fetch the entries of the collection type with the given `uid`. */
    path: (uid: string) => `/sortable-entries/fetch-entries/${uid}`,
  },

  /** The configuration for the update sort order request. */
  updateSortOrderRequest: {
    /** The path to update the sort order of the collection type with the given `uid`. */
    path: (uid: string) => `/sortable-entries/update-sort-order/${uid}`,
  },
};

//
// Components
//

/**
 * A modal component that retrieves entries from the current collection type,
 * presents them in a sortable list, and enables saving changes via a submit button.
 *
 * @param uid - The unique identifier of the content type which entries are sorted.
 * @param sortOrderField - The database field containing the order of the sorted entries.
 * @param mainField - The displayed field of each entry in the collection type.
 */
const SortModal = ({
  uid,
  sortOrderField,
  mainField,
}: {
  uid: UID.ContentType;
  sortOrderField: string;
  mainField: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const { toggleNotification } = useNotification();
  const { formatMessage } = useIntl();
  const translate = (key: string): string => formatMessage({ id: prefixKey(key) });

  const fetchClient = useFetchClient();
  const [entriesFetchState, setEntriesFetchState] = useState<EntriesFetchState>({
    status: FetchStatus.Initial,
  });

  const initialParams = { filters: undefined, plugins: { i18n: { locale: undefined } } };
  const [queryParams, _] = useQueryParams(initialParams);
  const filters = queryParams.query.filters;
  const locale = queryParams.query.plugins.i18n.locale;

  /**
   * Fetches the entries of the current collection type.
   */
  const fetchEntries = async () => {
    setEntriesFetchState({ status: FetchStatus.Loading });

    try {
      const { data: entries } = await fetchClient.get<Entries>(
        config.fetchEntriesRequest.path(uid),
        {
          params: { sortOrderField, mainField, filters, locale },
        }
      );

      setEntriesFetchState({ status: FetchStatus.Resolved, value: entries });
    } catch (error) {
      console.error(`Failed to fetch data: ${error}`);

      // This will show a corresponding error message in the modal.
      // We therefore don't need to trigger an extra notification here.
      setEntriesFetchState({ status: FetchStatus.Failed });
    }
  };

  // Fetch the entries every time our modal is opened.
  useEffect(() => {
    if (isOpen) {
      fetchEntries();
    }
  }, [isOpen]);

  /**
   * The callback for the drag-end event.
   *
   * - See also: https://docs.dndkit.com/presets/sortable
   */
  const handleDragEnd: DragEndEvent = (activeID: UniqueIdentifier, overID: UniqueIdentifier) => {
    setEntriesFetchState((entriesFetchState) => {
      if (entriesFetchState.status !== FetchStatus.Resolved) {
        return entriesFetchState;
      }

      const oldEntries = entriesFetchState.value;
      const oldIndex = oldEntries.findIndex((entry) => entry.documentId === activeID);
      const newIndex = oldEntries.findIndex((entry) => entry.documentId === overID);
      const newEntries = arrayMove(oldEntries, oldIndex, newIndex);

      return { status: FetchStatus.Resolved, value: newEntries };
    });
  };

  /**
   * The callback for the submit event.
   */
  const handleSubmit = async () => {
    if (entriesFetchState.status !== FetchStatus.Resolved) {
      console.error('Expect submit button to be disabled in a non `resolved` fetch state.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Converts the data-models into data-models for the POST request below.
      const entries = entriesFetchState.value;
      const sortedDocumentIds = entries.map((entry) => entry.documentId);

      await fetchClient.post(config.updateSortOrderRequest.path(uid), {
        data: {
          sortOrderField,
          sortedDocumentIds,
          filters,
          locale,
        },
      });

      setIsOpen(false);

      // Workaround to refresh only the list view without reloading the entire page:
      // Appends a timestamp-based query parameter to trigger a targeted refresh.
      //
      // Based on:
      // https://stackoverflow.com/a/71466484
      const timestamp = String(Date.now());
      searchParams.set('t', timestamp);
      setSearchParams(searchParams);
    } catch (error) {
      console.error(`Failed to submit data: ${error}`);

      // We failed to submit the data.
      // This can e.g. happen when the entries of a filtered modal are outdated.
      toggleNotification({ type: 'danger', message: translate('notification.failure') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitButtonDisabled = isSubmitting || entriesFetchState.status !== FetchStatus.Resolved;
  const isSubmitButtonLoading = isSubmitting;

  return (
    <Modal.Root open={isOpen} onOpenChange={setIsOpen}>
      <Modal.Trigger>
        <IconButton>
          <Drag />
        </IconButton>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>
            <FormattedMessage id={prefixKey('title')} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SortModalBody
            entriesFetchState={entriesFetchState}
            mainField={mainField}
            handleDragEnd={handleDragEnd}
            disabled={isSubmitting}
          />
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary">
              <FormattedMessage id={prefixKey('cancelButton.title')} />
            </Button>
          </Modal.Close>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitButtonDisabled}
            loading={isSubmitButtonLoading}
          >
            <FormattedMessage id={prefixKey('submitButton.title')} />
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export default SortModal;
