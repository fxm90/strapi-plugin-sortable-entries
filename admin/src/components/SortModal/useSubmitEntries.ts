import { useCallback, useEffect, useRef, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import { AsyncStatus } from '../../constants';

//
// Types
//

import type { UID, Data } from '@strapi/strapi';
import type { SubmitEntriesState } from '../../types';

//
// Config
//

const config = {
  /** The configuration for the update sort order request. */
  updateSortOrderRequest: {
    /** The path to update the sort order of the collection type with the given `uid`. */
    path: (uid: string) => `/sortable-entries/update-sort-order/${uid}`,
  },
};

//
// Hook
//

export const useSubmitEntries = ({
  uid,
  filters,
  locale,
}: {
  uid: UID.ContentType;
  filters: unknown;
  locale: string | undefined;
}) => {
  const fetchClient = useFetchClient();
  const [submitEntriesState, setSubmitEntriesState] = useState<SubmitEntriesState>({
    status: AsyncStatus.Initial,
  });

  /** The ref for the abort controller used to cancel in-flight requests. */
  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  /**
   * Triggers the submit entries workflow for the given content type.
   *
   * - Note: We wrap the function in `useCallback` to ensure a stable function identity across renders.
   *         This prevents unnecessary re-renders or effect re-executions in components that depend on this function.
   */
  const submitEntries = useCallback(
    async (sortedDocumentIds: Data.DocumentID[]) => {
      // Abort any in-flight request before starting a new one.
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      // We extract the signal from the abort controller here to ensure that we are using the correct signal in the async operations below,
      // even if the `abortControllerRef.current` value changes in the meantime (e.g. due to another call to `submitEntries` or `resetSubmitEntriesState`).
      const { signal } = abortControllerRef.current;

      setSubmitEntriesState({ status: AsyncStatus.InProgress });
      try {
        await fetchClient.post(config.updateSortOrderRequest.path(uid), {
          data: {
            sortedDocumentIds,
            filters,
            locale,
          },
          signal,
        });

        setSubmitEntriesState({ status: AsyncStatus.Success });
      } catch (error) {
        if (signal.aborted) {
          // Silently ignore errors caused by an intentional abort.
          return;
        }

        console.error('Failed to submit sort data:', error);
        setSubmitEntriesState({ status: AsyncStatus.Failed, error });
      }
    },

    // - Note: `fetchClient` is stable across renders.
    [fetchClient, uid, filters, locale]
  );

  /**
   * Resets the entries submit state to its initial value and aborts any in-flight request.
   *
   * - Note: We wrap the function in `useCallback` to ensure a stable function identity across renders.
   *         This prevents unnecessary re-renders or effect re-executions in components that depend on this function.
   */
  const resetSubmitEntriesState = useCallback(() => {
    // Abort any in-flight request before resetting the state.
    abortControllerRef.current?.abort();
    setSubmitEntriesState({ status: AsyncStatus.Initial });
  }, []);

  return { submitEntriesState, submitEntries, resetSubmitEntriesState };
};
