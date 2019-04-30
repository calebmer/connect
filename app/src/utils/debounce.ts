/**
 * Debounce an action so that many calls in a short period of time become
 * one call. That one call will use the arguments of the last call.
 *
 * We ask for a time duration in milliseconds to wait for the final call in a
 * sequence of calls.
 */
export function debounce<Args extends Array<unknown>>(
  ms: number,
  action: (...args: Args) => void,
) {
  let timeoutID: null | number = null;

  return (...args: Args): void => {
    if (timeoutID !== null) {
      clearTimeout(timeoutID);
    }

    timeoutID = setTimeout(() => {
      action(...args);
    }, ms);
  };
}
