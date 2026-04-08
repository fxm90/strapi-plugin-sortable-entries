import { useCallback, useEffect, useRef, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import { AsyncStatus } from '../../constants';

//
// Types
//

import type { UID } from '@strapi/strapi';
import type { Entries, FetchEntriesState } from '../../types';

//
// Config
//

const config = {
  /** The configuration for the fetch entries request. */
  fetchEntriesRequest: {
    /** The path to fetch the entries of the collection type with the given `uid`. */
    path: (uid: string) => `/sortable-entries/fetch-entries/${uid}`,
  },
};

//
// Hook
//

export const useFetchEntries = ({
  uid,
  mainField,
  filters,
  locale,
}: {
  uid: UID.ContentType;
  mainField: string;
  filters: unknown;
  locale: string | undefined;
}) => {
  const fetchClient = useFetchClient();
  const [fetchEntriesState, setFetchEntriesState] = useState<FetchEntriesState>({
    status: AsyncStatus.Initial,
  });

  /** The ref for the abort controller used to cancel in-flight requests. */
  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  // Serialize filters to a stable string for use in the `useCallback` dependency array below.
  //
  // `useQueryParams` may return a new object reference for `filters` on every render even when the filter values are unchanged,
  //  which would cause `fetchEntries` to be recreated on every render and trigger an infinite refetch loop via the effect that depends on `fetchEntries`.
  const filtersAsJSONString = JSON.stringify(filters);

  /**
   * Triggers the fetch entries workflow for the given content type.
   *
   * - Note: We wrap the function in `useCallback` to ensure a stable function identity across renders.
   *         This prevents unnecessary re-renders or effect re-executions in components that depend on this function.
   */
  const fetchEntries = useCallback(async () => {
    // Abort any in-flight request before starting a new one.
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // We extract the signal from the abort controller here to ensure that we are using the correct signal in the async operations below,
    // even if the `abortControllerRef.current` value changes in the meantime (e.g. due to another call to `fetchEntries` or `resetFetchEntriesState`).
    const { signal } = abortControllerRef.current;

    setFetchEntriesState({ status: AsyncStatus.InProgress });
    try {
      const { data: entries } = await fetchClient.get<Entries>(
        config.fetchEntriesRequest.path(uid),
        {
          params: { mainField, filters, locale },
          signal,
        }
      );

      setFetchEntriesState({ status: AsyncStatus.Success, data: entries });
    } catch (error) {
      if (signal.aborted) {
        // Silently ignore errors caused by an intentional abort.
        return;
      }

      console.error('Failed to fetch sort data:', error);
      setFetchEntriesState({ status: AsyncStatus.Failed, error });
    }

    // - Note: `fetchClient` is stable across renders.
    // - Note: `filtersAsJSONString` is used instead of `filters` to prevent recreating this callback when `useQueryParams` returns a new object reference
    //          for an unchanged filter value. The closure still captures the original `filters` object which has the same value as `filtersAsJSONString`.
  }, [fetchClient, uid, mainField, filtersAsJSONString, locale]);

  /**
   * Resets the entries fetch state to its initial value and aborts any in-flight request.
   *
   * - Note: We wrap the function in `useCallback` to ensure a stable function identity across renders.
   *         This prevents unnecessary re-renders or effect re-executions in components that depend on this function.
   */
  const resetFetchEntriesState = useCallback(() => {
    // Abort any in-flight request before resetting the state.
    abortControllerRef.current?.abort();
    setFetchEntriesState({ status: AsyncStatus.Initial });
  }, []);

  return { fetchEntriesState, fetchEntries, resetFetchEntriesState };
};
