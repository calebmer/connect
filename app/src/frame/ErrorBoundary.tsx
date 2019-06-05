import {ErrorScreen} from "./ErrorScreen";
import React from "react";
import {Route} from "../router/Route";

type Props = {
  route: Route;
  onRetry?: () => void;
  children: React.Node;
};

type State = {
  hasError: boolean;
  error: unknown;
};

export class ErrorBoundary extends React.Component<Props, State> {
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

  componentDidCatch() {
    // Seems like adding this will cause React to print the component stack.
  }

  render() {
    const {hasError, error} = this.state;
    const {onRetry, route, children} = this.props;
    return hasError ? (
      <ErrorScreen
        route={route}
        error={error}
        onRetry={
          onRetry &&
          (() => {
            onRetry();
            this.setState({hasError: false, error: null});
          })
        }
      />
    ) : (
      children
    );
  }
}
