import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { prefixKey } from '../utils/prefixKey';

/**
 * Returns shared formatting utilities.
 *
 * - `translate(key, values?)` — translates a message by its unprefixed key, optionally substituting values.
 */
export const useFormatters = () => {
  const { formatMessage } = useIntl();

  /**
   * Translates a message by its unprefixed key, optionally substituting values.
   *
   * - Note: We wrap the function in `useCallback` to ensure a stable function identity across renders.
   *         This prevents unnecessary re-renders or effect re-executions in components that depend on this function.
   */
  const translate = useCallback(
    (key: string, values?: Record<string, string | number>): string =>
      formatMessage({ id: prefixKey(key) }, values),
    [formatMessage]
  );

  return { translate };
};
