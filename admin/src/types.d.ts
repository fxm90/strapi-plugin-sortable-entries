import type { Data } from '@strapi/strapi';
import type { FetchStatus } from './constants';

//
// Shared types for the sortable list.
//

export type UniqueIdentifier = number | string;
export type DragEndEvent = (activeID: UniqueIdentifier, overID: UniqueIdentifier) => void;

/** The view model for a single item in the sortable list component. */
export interface SortableListItem {
  id: UniqueIdentifier;
  label: string;
}

/** An array of view models for the sortable list component. */
export type SortableList = Array<SortableListItem>;

//
// Shared types for the API response.
//

/** A single entry in a collection type. */
export interface Entry {
  documentId: Data.DocumentID;
  [key: string]: string;
}

/**
 * The entries of a collection type.
 *
 * - Note: This name is aligned with the official Strapi documentation:
 *         "Collection types: content-types that can manage several entries."
 */
export type Entries = Array<Entry>;

//
// Shared types for the modal component(s).
//

/**
 * Represents the full lifecycle of an asynchronous fetch operation.
 *
 * @template T The type of the data returned upon a successful fetch.
 */
export type FetchState<T> =
  | { status: FetchStatus.Initial }
  | { status: FetchStatus.Loading }
  | { status: FetchStatus.Resolved; value: T }
  | { status: FetchStatus.Failed };

export type EntriesFetchState = FetchState<Entries>;
