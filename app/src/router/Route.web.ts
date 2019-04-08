import {History, Location} from "history";
import {PathBase, PathPattern, PathVariableProps} from "./Path";
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
 * All of the routes registered in our application.
 */
const routes: Array<{
  readonly path: PathPattern<PathBase>;
  readonly render: (variables: PathVariableProps<PathBase>) => ReactElement;
}> = [];

/**
 * Finds the appropriate component to render for the provided location and
 * creates a React element for that component. Returns undefined if no route
 * matches the provided location.
 *
 * TODO: Currently this is O(n) where n is the number of routes we have. We
 * could improve performance with a route map. Right now n is small, though, so
 * we don’t bother. We will need to bother in the future when we have lots
 * of routes.
 */
export function getRoute(
  location: Location<undefined>,
): ReactElement | undefined {
  for (let i = 0; i < routes.length; i++) {
    const {path, render} = routes[i];
    const variables = path.parse(location.pathname);
    if (variables !== undefined) {
      return render(variables);
    }
  }
  return undefined;
}

/**
 * Registers a route component in our `routeMap` which we can use for selecting
 * the route to render based on the URL.
 */
export class RouteConfig<
  Path extends PathBase,
  Props extends {readonly route: RouteBase} & PathVariableProps<Path>
> extends RouteConfigBase<Path, Props> {
  /**
   * Registers a component to our route map. Throws an error if the path already
   * exists in our route map.
   */
  protected registerComponent(LazyComponent: React.ComponentType<Props>) {
    // Setup the variables that use our route config.
    const route = new Route(this);

    // Actually register our component.
    //
    // NOTE: We use the same `<RouteRoot>` component on every render so that
    // React does not unmount the previous route component if it is the same as
    // the next route component.
    routes.push({
      path: this.path,
      render: variables => {
        return React.createElement(RouteRoot, {
          RouteComponent: LazyComponent,
          routeProps: {...variables, route},
        } as any);
      },
    });
  }
}

/**
 * NOTE: Unlike on the native side, we use the same component for every route
 * root on the web. That way, when we render a new route if that route renders
 * the same component as our old route then React will not unmount the
 * old component.
 */
function RouteRoot<Props>({
  RouteComponent,
  routeProps,
}: {
  RouteComponent: React.ComponentType<Props>;
  routeProps: Props;
}) {
  return React.createElement(
    React.Suspense,
    {fallback: null},
    React.createElement(RouteComponent, routeProps),
  );
}

export class Route extends RouteBase {
  private readonly config: RouteConfig<any, any>;

  constructor(config: RouteConfig<any, any>) {
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
  protected _push<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfig<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ) {
    // TODO: Implement passing `partialProps` to the new component. Right now
    // we only use the required props to print the next path.
    //
    // Also do this for `_replace()`.
    history.push(nextRoute.path.print(props as NextProps));
  }

  /**
   * Goes back to the last route in browser history.
   *
   * This actually changes browser history! The user won’t be able to return
   * to the current route by pressing the back button. It’s like they pressed
   * the back button in their browser.
   */
  protected _pop() {
    history.goBack();
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
   * We could implement this method on web, but we choose not to.
   *
   * If we really want `popTo()` on the web then maybe we’ll add an
   * `actuallyPopTo()` method which pops on both platforms instead of using an
   * intelligent default on web.
   */
  protected _popTo() {
    this.push(this.config, {});
  }

  /**
   * Replaces the current route in our navigation stack with a new one.
   *
   * Actually replaces the route on web instead of naively pushing a new route!
   * Use this when redirecting a user to a new path so they won’t fight with
   * the back button when trying to navigate backwards.
   */
  protected _webReplace<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfig<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): void {
    // TODO: Implement passing `partialProps` to the new component. Right now
    // we only use the required props to print the next path.
    //
    // Also do this for `_push()`.
    history.replace(nextRoute.path.print(props as NextProps));
  }

  /**
   * Calls `_push()` instead of resetting browser history which would be totally
   * unexpected by the user.
   */
  protected _nativeSwapRoot<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfig<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): void {
    this._push(nextRoute, props);
  }

  /**
   * Call `_push()` without a fancy animation.
   */
  protected _nativeShowModal<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfig<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): void {
    this._push(nextRoute, props);
  }
}
