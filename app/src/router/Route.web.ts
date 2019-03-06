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
export const history: History<undefined> = createBrowserHistory();

/**
 * A map from paths to the component rendered at that path.
 */
const routeMap = new Map<string, React.ComponentType<{}>>();

/**
 * Finds the appropriate component to render for the provided location and
 * creates a React element for that component. Returns undefined if no route
 * matches the provided location.
 */
export function getRoute(
  location: Location<undefined>,
): ReactElement<unknown> | undefined {
  const Component = routeMap.get(location.pathname);
  if (Component === undefined) {
    return undefined;
  }
  return React.createElement(Component, null);
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

    // Setup the variables that use our route config.
    const defaultProps = this.defaultProps;
    const route = new Route(this);

    /**
     * Our route component renders the lazy component with our default props and
     * route object.
     */
    function RouteRoot() {
      // Create the lazy component element with all the appropriate props.
      const element = React.createElement(LazyComponent, {
        ...defaultProps,
        route,
      } as any);

      // We need to wrap our lazy component in `<React.Suspense>` to handle
      // the `React.lazy()` suspend.
      return React.createElement(React.Suspense, {fallback: null}, element);
    }

    // Actually register our component.
    routeMap.set(this.path, RouteRoot);
  }
}

export class Route extends RouteBase {
  private readonly config: RouteConfig<any>;

  constructor(config: RouteConfig<any>) {
    super();
    this.config = config;
  }

  /**
   * Pushes a new route to the navigation stack.
   *
   * NOTE: Currently, web does not support passing some props to the new route.
   * Only native supports that. We have not yet found a use case on the web, so
   * we’re ignoring the problem for now.
   *
   * IMPORTANT: To use `history` state the value must be serializable. (Like
   * a `JSONValue`). This causes bugs since our current implementation allows
   * _any_ props instead of just serializable props. Instead of fixing this we
   * choose to ignore props for now.
   */
  push<NextProps extends {readonly route: RouteBase}>(
    nextRoute: RouteConfig<NextProps>,
    _partialProps: Partial<Omit<NextProps, "route">>,
  ) {
    // TODO: Implement `partialProps`.
    history.push(nextRoute.path);
  }

  /**
   * Pushes a route with the same configuration as this one to the navigation
   * stack. Unlike native which actually moves backwards in the
   * navigation stack.
   *
   * In native, we may use `popTo()` for the animation which creates a feeling
   * of depth in the app. However, on web moving backwards in history breaks the
   * back button which breaks the user’s perception of the web. Our default on
   * web should always be to push forward. That’s what users are used to.
   *
   * If we really want `popTo()` on the web then maybe we’ll add an
   * `actuallyPopTo()` method which pops on both platforms instead of using an
   * intelligent default on web.
   */
  popTo() {
    this.push(this.config, {});
  }
}
