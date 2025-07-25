/**
 * Represents the status of an asynchronous fetch operation.
 *
 * @see FetchState
 */
export enum FetchStatus {
  Initial = 'initial',
  Loading = 'loading',
  Resolved = 'resolved',
  Failed = 'failed',
}
