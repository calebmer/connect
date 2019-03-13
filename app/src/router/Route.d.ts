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

  protected _push<NextProps extends {readonly route: RouteBase}>(
    nextRoute: RouteConfigBase<NextProps>,
    partialProps: Partial<Pick<NextProps, Exclude<keyof NextProps, "route">>>,
  ): void;

  protected _popTo(): void;

  protected _swapRoot<NextProps extends {readonly route: RouteBase}>(
    nextRoute: RouteConfigBase<NextProps>,
    partialProps: Partial<Pick<NextProps, Exclude<keyof NextProps, "route">>>,
  ): void;
}
