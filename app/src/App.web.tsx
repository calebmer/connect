import React, {useEffect, useState} from "react";
import {getRoute, history} from "./router/Route.web";
import {AppError} from "./api/AppError";
import {BreakpointContext} from "./utils/Breakpoint";
import {ErrorScreen} from "./frame/ErrorScreen";

/**
 * Manages routing based on the location for our web-app.
 */
export function App() {
  return (
    <React.unstable_ConcurrentMode>
      <AppConcurrent />
    </React.unstable_ConcurrentMode>
  );
}

function AppConcurrent() {
  const [location, setLocation] = useState(history.location);

  useEffect(() => {
    setLocation(history.location);
    const unlisten = history.listen(newLocation => {
      setLocation(newLocation);
    });
    return unlisten;
  }, []);

  // Get the element to render for this location.
  const element = getRoute(location);

  // Render a 404 page if our router was not able to create an element for
  // this location.
  if (element === undefined) {
    return (
      <BreakpointContext>
        <ErrorScreen
          error={new AppError("Could not find the page you are looking for.")}
        />
      </BreakpointContext>
    );
  } else {
    return element;
  }
}

// Decision: The React team has deprecated `findDOMNode` in strict mode.
// However, `findDOMNode` (or `findHostInstance` as it is called in the
// cross-platform reconciler) is used extensively in the React Native codebase
// so therefore is also used extensively in the React Native Web codebase.
//
// The reason given for [deprecating `findDOMNode`][1] is that `findDOMNode`
// “breaks abstraction levels” and that refs should be used instead.
//
// Since the deprecation of `findDOMNode` is unrelated to the particular
// behaviors of React Concurrent Mode and is instead a deprecation based on
// principles, we decide to ignore the React deprecation until it is handled
// in React Native itself.
//
// [1]: https://reactjs.org/docs/strict-mode.html#warning-about-deprecated-finddomnode-usage
if (__DEV__) {
  /* eslint-disable no-console */
  const consoleError = console.error;
  console.error = function() {
    if (
      /%s is deprecated in StrictMode/.test(arguments[0]) &&
      arguments[1] === "findDOMNode"
    ) {
      return;
    }
    return (consoleError as any).apply(this, arguments);
  };
  /* eslint-enable no-console */
}
