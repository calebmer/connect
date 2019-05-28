import {BreakpointContext} from "../utils/Breakpoint";
import {ErrorScreen} from "../frame/ErrorScreen";
import React from "react";
import {Repair} from "../cache/Repair";
import {Route} from "./Route";

type Props = {
  route: Route;
  children: React.Node;
};

type State = {
  hasError: boolean;
  error: unknown;
};

/**
 * Our route container does a couple of things:
 *
 * 1. Provide global application context. We can’t put that context in a root
 *    app component since we don’t have a root app component on native.
 *    (because of React Native Navigation)
 *
 * 2. Add a top-level Suspense handler which doesn’t render anything too
 *    interesting.
 *
 * 3. Catch errors and render an error screen. We can also trigger retries which
 *    will clear our caches and force a reload.
 */
export class RouteContainer extends React.Component<Props, State> {
  state = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    // Don’t show the React error overlay if we’ve caught the error.
    if (__DEV__ && typeof error === "object" && error !== null) {
      (error as any).disableReactErrorOverlay = true;
    }

    return {
      hasError: true,
      error,
    };
  }

  private handleRetry = () => {
    // Attempt to repair our application state!
    Repair.attempt();

    // Clear the error from our state.
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    return (
      <BreakpointContext>
        {this.state.hasError ? (
          <ErrorScreen
            route={this.props.route}
            error={this.state.error}
            onRetry={this.handleRetry}
          />
        ) : (
          <React.Suspense fallback={null}>{this.props.children}</React.Suspense>
        )}
      </BreakpointContext>
    );
  }
}