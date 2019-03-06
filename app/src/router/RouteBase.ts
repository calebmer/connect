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
  Props extends {readonly route: RouteBase}
> {
  /**
   * The URL path this route is registered on. If you enter this path into a
   * web browser or use this path in a deep link, you will reach this route!
   *
   * This path should be globally unique since we will globally register our
   * route with this path.
   */
  public readonly path: string;

  /**
   * The props we will use to render this route if no other props are provided
   * during navigation.
   *
   * The props of a component might include some session data. For instance,
   * knowledge about who pushed a component to the navigation stack. If a
   * client navigates out-of-the-blue to this route we won’t expect them to
   * provide detailed runtime bookkeeping props. Instead we will use our
   * default props to satisfy our component.
   */
  protected readonly defaultProps: Omit<Props, "route">;

  /**
   * The state of our lazily loaded component. As the component loads we will
   * update this state appropriately. Once the component finishes loading we
   * will have synchronous access to the component through this member.
   */
  private componentState: LazyComponentState<React.ComponentType<Props>>;

  constructor({
    path,
    component,
    defaultProps,
  }: {
    /**
     * The path this route is registered on. If a client navigates to this path
     * then we will display the route’s component.
     */
    readonly path: string;
    /**
     * The component rendered by this route. We force the component to be a
     * promise to encourage code splitting with `import()`.
     */
    readonly component: () => Promise<React.ComponentType<Props>>;
    /**
     * The props we will use to render this route if no other props are provided
     * during navigation.
     */
    readonly defaultProps: Omit<Props, "route">;
  }) {
    this.path = path;
    this.defaultProps = defaultProps;
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
   * route component has finished loading.
   *
   * Calling this multiple times will return the same promise.
   */
  loadComponent(): Promise<React.ComponentType<Props>> {
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
  hasComponentLoaded(): boolean {
    return this.componentState.status === 2 || this.componentState.status === 3;
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
   * to the user.
   *
   * The props object is “partial” which means all the props are optional. If
   * a required prop is not provided then we will use the value from
   * `defaultProps` when the route was configured.
   */
  abstract push<NextProps extends {readonly route: RouteBase}>(
    nextRoute: RouteConfigBase<NextProps>,
    partialProps: Partial<Omit<NextProps, "route">>,
  ): void;

  /**
   * Returns us to the current route by popping all routes in our navigation
   * stack above this one.
   *
   * By keeping a reference to this route after calling `push()` we can easily
   * return to this route from any future route.
   *
   * On web, this will push a new route with the same config instead of popping
   * back to our route’s reference. We do this because on web popping breaks
   * the back button which breaks the user’s perception. Navigation through
   * space is perceived differently on web and native. If we want a method
   * that actually pops on both native and web we might implement an
   * `actuallyPopTo()` method in the future.
   */
  abstract popTo(): void;
}
