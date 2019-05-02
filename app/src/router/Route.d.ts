import {PathBase, PathVariableProps} from "./Path";
import {RouteBase, RouteConfigBase} from "./RouteBase";
import React from "react";

// Utility type for removing keys from an object.
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

/**
 * Configuration for a route that uses stack-based navigation. We can use the
 * configuration to create a new route.
 */
export class RouteConfig<
  Path extends PathBase,
  Props extends {readonly route: Route} & PathVariableProps<Path>
> extends RouteConfigBase<Path, Props> {
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

  protected _push<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): Promise<void>;

  protected _pop(): void;

  protected _popTo(): void;

  protected _webReplace<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): void;

  protected _nativeSwapRoot<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): void;

  protected _nativeShowModal<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfigBase<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): void;
}
