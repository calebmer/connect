import React from "react";

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

  constructor({
    path,
    component,
  }: {
    readonly path: string;
    readonly component: () => Promise<React.ComponentType<Props>>;
  }) {
    this.path = path;

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
   */
  abstract push<NextProps extends {readonly route: RouteBase}>(
    nextRoute: RouteConfigBase<NextProps>,
    props: Pick<NextProps, Exclude<keyof NextProps, "route">>,
  ): void;

  /**
   * Returns us to the current route by popping all routes in our navigation
   * stack above this one.
   *
   * By keeping a reference to this route after calling `push()` we can easily
   * return to this route from any future route.
   */
  abstract popTo(): void;
}
