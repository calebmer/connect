import {PathBase, PathPattern, PathVariableProps} from "./Path";
import React from "react";

// Utility type for removing keys from an object.
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

/**
 * Configuration for a route that uses stack-based navigation. We can use the
 * configuration to create a new route.
 *
 * This is the common code for a `RouteConfig`. The cross-platform
 * implementation lives in `Route.native.ts` and `Route.web.ts`.
 */
export abstract class RouteConfigBase<
  Path extends PathBase,
  Props extends {readonly route: RouteBase} & PathVariableProps<Path>
> {
  /**
   * The URL path this route is registered on. If you enter this path into a
   * web browser or use this path in a deep link, you will reach this route!
   *
   * This path should be globally unique since we will globally register our
   * route with this path.
   */
  public readonly path: PathPattern<Path>;

  /**
   * The state of our lazily loaded component. As the component loads we will
   * update this state appropriately. Once the component finishes loading we
   * will have synchronous access to the component through this member.
   */
  private componentState: LazyComponentState<React.ComponentType<Props>>;

  constructor({
    path,
    component,
  }: {
    readonly path: PathPattern<Path>;

    // NOTE: We force the component to be a promise to encourage code splitting
    // with `import()`.
    //
    // NOTE: If there’s a required prop that is not `{route: RouteBase}` or
    // `PathVariableProps<Path>` then expect this function to error!
    readonly component: () => Promise<React.ComponentType<Props>>;
  }) {
    this.path = path;
    this.componentState = {status: 0, result: component};

    /**
     * A lazy component translates the state of our lazy-loaded component
     * promise into a React component. If the component is not yet loading then
     * we suspend.
     */
    const LazyComponent = (props: Props) => {
      switch (this.componentState.status) {
        // If our promise is not resolved then suspend our component by
        // throwing a promise! Yay, Suspense.
        case 0:
        case 1:
          throw this.loadComponent();

        // If our promise is resolved then render our React component.
        case 2:
          return React.createElement(this.componentState.result, props);

        // If our promise is rejected then throw the error.
        case 3:
          throw this.componentState.result;

        default: {
          const never: never = this.componentState;
          throw new Error(`Unexpected state: ${JSON.stringify(never)}`);
        }
      }
    };

    // Register the lazy component we just created.
    this.registerComponent(LazyComponent);
  }

  /**
   * Performs some side-effects during construction to globally register our
   * route’s component.
   */
  protected abstract registerComponent(
    LazyComponent: React.ComponentType<Props>,
  ): void;

  /**
   * Loads the route’s component and returns a promise which resolves when the
   * route component has finished loading. This function can be used to preload
   * a component before we navigate to that route.
   *
   * Calling this multiple times will return the same promise.
   */
  public loadComponent(): Promise<React.ComponentType<Props>> {
    switch (this.componentState.status) {
      case 0: {
        const promise = this.componentState.result();
        this.componentState = {status: 1, result: promise};
        promise.then(
          value => {
            this.componentState = {status: 2, result: value};
          },
          error => {
            this.componentState = {status: 3, result: error};
          },
        );
        return promise;
      }
      case 1:
        return this.componentState.result;
      case 2:
        return Promise.resolve(this.componentState.result);
      case 3:
        return Promise.reject(this.componentState.result);
      default: {
        const never: never = this.componentState;
        throw new Error(`Unexpected state: ${JSON.stringify(never)}`);
      }
    }
  }

  /**
   * Lets us know if the component has been loaded. Whether it resolved
   * or rejected.
   *
   * If the component has not loaded you may call `loadComponent()` to get a
   * promise which resolves when the component finishes loading.
   */
  public hasComponentLoaded(): boolean {
    return this.componentState.status === 2 || this.componentState.status === 3;
  }

  /**
   * Waits for the route’s component to load before executing an action, but
   * only wait for 100ms. A user won’t be able to notice a stall of 100ms or
   * less. Any delay longer then that and the interface no longer
   * feels responsive.
   */
  public waitForComponent(action: () => void) {
    // If the component has already loaded then immediately execute the action.
    if (this.hasComponentLoaded()) {
      action();
      return;
    }

    // NOTE: We shouldn’t need this when React Concurrent Mode and Suspense are
    // fully released. However, for now this is necessary to get the
    // same experience.

    // Did we time out while waiting for the next route to load?
    let timedOut = false;

    // We want to wait until our route has loaded before we move on to the next
    // route. However, on slow networks we also want to feel responsive. [At
    // 100ms it starts to feel like the app isn’t responsive][1], so if our
    // route component does not load within 100ms push the new route and display
    // the loading fallback.
    //
    // [1]: https://developers.google.com/web/fundamentals/performance/rail
    const timeoutID = setTimeout(() => {
      timedOut = true;
      action();
    }, 100);

    // Load the next route’s component. If we resolve before our timeout then
    // immediately push our next route and clear our timer.
    this.loadComponent().then(
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
}

/**
 * The state of a component which is lazily loaded.
 */
type LazyComponentState<T> =
  | {status: 0; result: () => Promise<T>} // Idle
  | {status: 1; result: Promise<T>} // Pending
  | {status: 2; result: T} // Resolved
  | {status: 3; result: any}; // Rejected

/**
 * A runtime “identifier” for some route that’s currently loaded in our
 * navigation history. If we have a reference to a route then we can use it to
 * navigate back to that route with `popTo()`. We can also use it to navigate
 * forwards by adding a new route to our navigation stack.
 *
 * This is the common code for a `Route`. The cross-platform implementation
 * lives in `Route.native.ts` and `Route.web.ts`.
 */
export abstract class RouteBase {
  /**
   * Pushes a new route to our navigation stack. The new route will be displayed
   * to the user. We wait a little bit for the next route’s component to load,
   * Suspense style, before progressing to the next route.
   *
   * The props object is “partial” which means all the props are optional. If
   * a required prop is not provided then we will use the value from
   * `defaultProps` when the route was configured.
   *
   * However, the path variable props are _always_ required. How to think
   * about this:
   *
   * 1. Required props that are not path variable props are optional and will be
   *    provided by `defaultProps`.
   * 2. Path variable props must always be provided when navigating to a
   *    new route.
   */
  public push<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ) {
    nextRoute.waitForComponent(() => {
      this._push(nextRoute, props);
    });
  }

  /**
   * Internal implementation of `push()`. We expect platform specific code to
   * override this function and not `push()` which handles some
   * Suspense-y stuff.
   */
  protected abstract _push<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): void;

  /**
   * Returns us to the route before the current one in the stack by removing
   * our current route from the stack.
   *
   * If you want to go back to a specific route in history use `popTo()` instead
   * which will return back to a particular route.
   */
  public pop(): void {
    this._pop();
  }

  /**
   * Internal implementation of `pop()` which child classes should override.
   */
  protected abstract _pop(): void;

  /**
   * Returns us to the current route by popping all routes in our navigation
   * stack above this one.
   *
   * By keeping a reference to this route after calling `push()` we can easily
   * return to this route from any future route.
   *
   * On web, this will push a new route with the same config instead of popping
   * back to our route’s reference. We do this because on web popping breaks
   * the back button which breaks the user’s perception.
   *
   * We could correctly implement this method on web, but we choose not to.
   */
  public popTo(): void {
    this._popTo();
  }

  /**
   * Internal implementation of `popTo()` which child classes should override.
   */
  protected abstract _popTo(): void;

  /**
   * Replace the current position in the navigation stack with the new route.
   * Effectively this will pop the current route and add the new one. We first
   * wait for the next route’s component to load before actually performing
   * the action.
   *
   * **NOTE:** On web this will _actually_ replace the current route! On native
   * this only pushes a new route.
   */
  public webReplace<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ) {
    nextRoute.waitForComponent(() => {
      this._webReplace(nextRoute, props);
    });
  }

  /**
   * Internal implementation of `webReplace()` which child classes
   * should override.
   */
  protected abstract _webReplace<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): void;

  /**
   * Reset the current navigation stack to the provided route. Removes old
   * routes so that they can’t be popped back to.
   *
   * On web, this will `push()` instead of resetting browser history. Since
   * resetting browser history is unexpected for web platform users.
   */
  public nativeSwapRoot<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ) {
    nextRoute.waitForComponent(() => {
      this._nativeSwapRoot(nextRoute, props);
    });
  }

  /**
   * Internal implementation of `nativeSwapRoot()` which child classes
   * should override.
   */
  protected abstract _nativeSwapRoot<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): void;

  /**
   * Shows the next route as a modal on native platforms. When we call `pop()`
   * on a modal route, the modal will automatically be dismissed.
   *
   * On web, this will `push()` without any fancy navigation animations.
   */
  public nativeShowModal<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ) {
    nextRoute.waitForComponent(() => {
      this._nativeShowModal(nextRoute, props);
    });
  }

  /**
   * Internal implementation of `nativeShowModal()` which child classes
   * should override.
   */
  protected abstract _nativeShowModal<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): void;
}
