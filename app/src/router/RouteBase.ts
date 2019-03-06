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

    // Wrap our component getter in `React.lazy()`. We will use Suspense (oooh)
    // to wait for our component to finish loading.
    const LazyComponent = React.lazy(() => {
      return component().then(c => ({default: c}));
    });
    this.registerComponent(LazyComponent);
  }

  /**
   * Performs some side-effects during construction to globally register our
   * route’s component.
   */
  protected abstract registerComponent(
    LazyComponent: React.LazyExoticComponent<React.ComponentType<Props>>,
  ): void;
}

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
