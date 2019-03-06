import {RouteBase, RouteConfigBase} from "./RouteBase";

/**
 * Configuration for a route that uses stack-based navigation. We can use the
 * configuration to create a new route.
 */
export class RouteConfig<Props> extends RouteConfigBase<Props> {}

/**
 * A runtime “identifier” for some route that’s currently loaded in our
 * navigation history. If we have a reference to a route then we can use it to
 * navigate back to that route with `popTo()`. We can also use it to navigate
 * forwards by adding a new route to our navigation stack.
 */
export class Route extends RouteBase {
  private constructor(...args: Array<unknown>);
}
