/**
 * Wait for a promise to resolve before executing an action in response to a
 * user input, but only wait 100ms! Any delay longer then that will make the
 * interface feel unresponsive.
 *
 * This balances the desire to always have content loaded when a user navigates
 * to a route and the desire to be responsive on slow networks. If we can fetch
 * the data and still feel responsive, awesome!
 *
 * We get the 100ms number from [Google’s Web Performance recommendations][1].
 *
 * [1]: https://developers.google.com/web/fundamentals/performance/rail
 */
export function stall(promise: Promise<unknown>, action: () => void) {
  // Did we time out while waiting for the promise to resolve?
  let timedOut = false;

  // If we timeout before the promise resolves then execute our action...
  const timeoutID = setTimeout(() => {
    timedOut = true;
    action();
  }, 100);

  // If our promise resolves before we time out then execute our action and
  // clear our timer.
  promise.then(
    () => {
      if (!timedOut) {
        clearTimeout(timeoutID);
        action();
      }
    },
    () => {
      if (!timedOut) {
        clearTimeout(timeoutID);
        action();
      }
    },
  );
}
