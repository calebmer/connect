import {History, Location} from "history";
import React, {ReactElement} from "react";
import {RouteBase, RouteConfigBase} from "./RouteBase";
import createBrowserHistory from "history/createBrowserHistory";

// Utility type for removing keys from an object.
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

/**
 * The interface we use for navigating browser history. We do not have a React
 * Native equivalent of this object.
 */
export const history: History<unknown> = createBrowserHistory();

/**
 * A map from paths to the component rendered at that path.
 */
const routeMap = new Map<
  string,
  React.ComponentType<{location: Location<unknown>}>
>();

/**
 * Finds the appropriate component to render for the provided location and
 * creates a React element for that component. Returns undefined if no route
 * matches the provided location.
 */
export function getRoute(
  location: Location<unknown>,
): ReactElement<unknown> | undefined {
  const Component = routeMap.get(location.pathname);
  if (Component === undefined) {
    return undefined;
  }
  return React.createElement(Component, {location});
}

/**
 * Registers a route component in our `routeMap` which we can use for selecting
 * the route to render based on the URL.
 */
export class RouteConfig<
  Props extends {readonly route: RouteBase}
> extends RouteConfigBase<Props> {
  /**
   * Registers a component to our route map. Throws an error if the path already
   * exists in our route map.
   */
  registerComponent(
    LazyComponent: React.LazyExoticComponent<React.ComponentType<Props>>,
  ) {
    // Throw an error if the route already exists in our route map.
    if (routeMap.has(this.path)) {
      throw new Error(
        `A route with path "${this.path}" was already registered.`,
      );
    }

    const defaultProps = this.defaultProps;

    /**
     * Our route component renders the lazy component with our default props,
     * optional location state, and finally the route object.
     */
    function RouteRoot({location}: {location: Location<unknown>}) {
      // Create the lazy component element with all the appropriate props.
      // Make sure to use the default props object in case some of our
      // required props were not provided!
      const element = React.createElement(LazyComponent, {
        ...defaultProps,
        ...(location.state as any),
        route: new Route(),
      });

      // We need to wrap our lazy component in `<React.Suspense>` to handle
      // the `React.lazy()` suspend.
      return React.createElement(React.Suspense, {fallback: null}, element);
    }

    // Actually register our component.
    routeMap.set(this.path, RouteRoot);
  }
}

/**
 * A route remembers its position in the browser history so that we may return
 * to that position.
 */
export class Route extends RouteBase {
  /**
   * The position in browser history when the route was constructed. Calculated
   * by `history.length` in the constructor.
   */
  private readonly position: number;

  constructor() {
    super();
    this.position = history.length;
  }

  /**
   * Pushes a new route to our navigation stack. Optionally may provide some
   * props which will be used to render the new route.
   */
  push<NextProps extends {readonly route: RouteBase}>(
    nextRoute: RouteConfigBase<NextProps>,
    partialProps: Partial<Omit<NextProps, "route">>,
  ) {
    history.push(nextRoute.path, partialProps);
  }

  /**
   * Moves to this route in history from wherever we are in the navigation
   * stack. Uses the route’s position in history during construction to do this.
   */
  popTo() {
    history.go(this.position - history.length);
  }
}
