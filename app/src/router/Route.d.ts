import {RouteBase, RouteConfigBase} from "./RouteBase";
import React from "react";

/**
 * Configuration for a route that uses stack-based navigation. We can use the
 * configuration to create a new route.
 */
export class RouteConfig<
  Props extends {readonly route: Route}
> extends RouteConfigBase<Props> {
  /**
   * Performs some side-effects during construction to globally register our
   * route’s component.
   */
  protected registerComponent(LazyComponent: React.ComponentType<Props>): void;
}

/**
 * A runtime “identifier” for some route that’s currently loaded in our
 * navigation history. If we have a reference to a route then we can use it to
 * navigate back to that route with `popTo()`. We can also use it to navigate
 * forwards by adding a new route to our navigation stack.
 */
export class Route extends RouteBase {
  private constructor(...args: Array<unknown>);

  /**
   * Internal implementation of `push()`. We expect platform specific code to
   * override this function and not `push()` which handles some
   * Suspense-y stuff.
   */
  protected _push<NextProps extends {readonly route: RouteBase}>(
    nextRoute: RouteConfigBase<NextProps>,
    partialProps: Partial<Pick<NextProps, Exclude<keyof NextProps, "route">>>,
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
  public popTo(): void;
}
