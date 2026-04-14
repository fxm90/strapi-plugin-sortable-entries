import type { Data } from '@strapi/strapi';
import type { AsyncStatus } from './constants';

//
// Shared types for the sortable list.
//

export type UniqueIdentifier = Data.DocumentID;
export type DragEndEvent = (oldIndex: number, newIndex: number) => void;

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
  mainField: string | number | null;
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

/** Represents a successful result. */
type SuccessResult<T> = T extends void
  ? { status: AsyncStatus.Success }
  : { status: AsyncStatus.Success; data: T };

/** Represents a failed result. */
type ErrorResult = {
  status: AsyncStatus.Failed;
  error: unknown;
};

/**
 * Describes the lifecycle state of an async operation.
 */
export type AsyncState<T = void> =
  | { status: AsyncStatus.Initial }
  | { status: AsyncStatus.InProgress }
  | SuccessResult<T>
  | ErrorResult;

export type FetchEntriesState = AsyncState<Entries>;
export type SubmitEntriesState = AsyncState<void>;
