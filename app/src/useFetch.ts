import {useEffect, useReducer, useRef} from "react";
import {JSONValue} from "@connect/api-client";

/**
 * The type of a fetch function for `useFetch()`. Fetchers may be aborted using
 * an `AbortController`.
 */
export type Fetcher<Input extends JSONValue, Output> = (
  signal: AbortSignal,
  input: Input,
) => Promise<Output>;

/**
 * A hook which uses IO to fetch some data. If the data is not yet available
 * then we throw a promise and let Suspense handle the loading state. We will
 * re-fetch when the result of `JSON.stringify()` on the input changes.
 *
 * You can think of this like our `Cache` module except we cache on a
 * per-component basis.
 */
export function useFetch<Input extends JSONValue, Output>(
  fetcher: Fetcher<Input, Output>,
  input: Input,
): Output {
  // Force update utility function will schedule an update for our component.
  const forceUpdate = useReducer(state => !state, false)[1];

  // Hold the current fetch state in a ref.
  const state = useRef<FetchState<Output> | null>(null);

  // If this is our first render then state will be `null`. Instead update it
  // to be a pending promise which can be resolved from the outside.
  if (state.current === null) {
    state.current = {
      status: FetchStatus.Pending,
      value: createPromiseResolver(),
    };
  }

  // Our effect needs to re-run whenever the fetch function changes or the input
  // to that fetch function.
  useEffect(() => {
    console.log("effect");

    // If our state is _not_ pending then let us set it to pending. Also force
    // update our component so that we’ll suspend.
    if (
      state.current === null ||
      state.current.status !== FetchStatus.Pending
    ) {
      state.current = {
        status: FetchStatus.Pending,
        value: createPromiseResolver(),
      };
      forceUpdate({});
    }

    // Get our resolve and reject hooks.
    const resolve = state.current.value.resolve;
    const reject = state.current.value.reject;

    // Setup our abort controller.
    const abortController = new AbortController();

    // Run the fetcher! Call our resolve/reject hooks when it completes.
    fetcher(abortController.signal, input).then(resolve, reject);

    // If our inputs change or the component un-mounts then we want to abort
    // our fetch.
    return () => abortController.abort();
  }, [fetcher, JSON.stringify(input)]); // eslint-disable-line react-hooks/exhaustive-deps

  // Return our asynchronous value in a Suspense friendly way.
  switch (state.current.status) {
    case FetchStatus.Pending:
      throw state.current.value.promise;
    case FetchStatus.Resolved:
      return state.current.value;
    case FetchStatus.Rejected:
      throw state.current.value;
    default: {
      const never: never = state.current;
      throw new Error(`Unexpected status: ${never["status"]}`);
    }
  }
}

type PromiseResolver<Value> = {
  promise: Promise<Value>;
  resolve: (value: Value) => void;
  reject: (error: unknown) => void;
};

function createPromiseResolver<Value>(): PromiseResolver<Value> {
  let resolve: (value: Value) => void | undefined;
  let reject: (error: unknown) => void | undefined;
  const promise = new Promise<Value>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {promise, resolve: resolve!, reject: reject!};
}

enum FetchStatus {
  Pending,
  Resolved,
  Rejected,
}

type FetchState<Value> =
  | {status: FetchStatus.Pending; value: PromiseResolver<Value>}
  | {status: FetchStatus.Resolved; value: Value}
  | {status: FetchStatus.Rejected; value: unknown};
