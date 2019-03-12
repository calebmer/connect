/**
 * Declares the `AbortController` type globally.
 */

/**
 * The AbortController interface represents a controller object that allows you
 * to abort one or more DOM requests as and when desired.
 */
interface AbortController {
  /**
   * Returns the AbortSignal object associated with this object.
   */
  readonly signal: AbortSignal;
  /**
   * Invoking this method will set this object's AbortSignal's aborted flag and
   * signal to any observers that the associated activity is to be aborted.
   */
  abort(): void;
}

declare const AbortController: {
  prototype: AbortController;
  new (): AbortController;
};

/**
 * The AbortSignal interface represents a signal object that allows you to
 * communicate with a DOM request (such as a Fetch) and abort it if required via
 * an AbortController object.
 */
interface AbortSignal {
  /**
   * Returns true if this AbortSignal's AbortController has signaled to abort, and false
   * otherwise.
   */
  readonly aborted: boolean;
}

interface RequestInit {
  signal?: AbortSignal;
}
