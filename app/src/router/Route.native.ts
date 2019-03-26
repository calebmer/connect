import {Layout, Navigation} from "react-native-navigation";
import {PathBase, PathVariableProps} from "./Path";
import React, {useMemo} from "react";
import {RouteBase, RouteConfigBase} from "./RouteBase";

// Utility type for removing keys from an object.
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

/**
 * Registers a route component with `react-native-navigation` and manages the
 * options we’ll pass to `react-native-navigation` when rendering the route.
 */
export class RouteConfig<
  Path extends PathBase,
  Props extends {readonly route: RouteBase} & PathVariableProps<Path>
> extends RouteConfigBase<Path, Props> {
  /**
   * Registers the component with `react-native-navigation`. Converts a
   * `componentId` into a `Route`.
   */
  protected registerComponent(LazyComponent: React.ComponentType<Props>): void {
    // Register the navigation component at our route’s path.
    Navigation.registerComponent(this.path.getID(), () => {
      return function RouteRoot({componentId, ...props}) {
        // Create the lazy component element with all the appropriate props.
        // Make sure to use the default props object in case some of our
        // required props were not provided!
        const route = useMemo(() => new Route(componentId), [componentId]);
        props.route = route;
        const element = React.createElement(LazyComponent, props);

        // We need to wrap our lazy component in `<React.Suspense>` to handle
        // the `LazyComponent` suspend.
        return React.createElement(React.Suspense, {fallback: null}, element);
      };
    });
  }

  /**
   * Gets the `react-native-navigation` layout.
   */
  public getLayout(props: Omit<Props, "route">): Layout {
    return {
      component: {
        name: this.path.getID(),
        passProps: props,
      },
    };
  }
}

/**
 * A wrapper around a `react-native-navigation` component ID. We use the
 * component ID to navigate.
 */
export class Route extends RouteBase {
  private readonly componentID: string;

  constructor(componentID: string) {
    super();
    this.componentID = componentID;
  }

  /**
   * Pushes a new route to our navigation stack.
   */
  protected _push<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfig<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ) {
    Navigation.push(this.componentID, nextRoute.getLayout(props));
  }

  /**
   * Pops the current route of the stack and shows us the previous route.
   */
  protected _pop() {
    Navigation.pop(this.componentID);
  }

  /**
   * Pops routes off the navigation stack until we return to this route.
   */
  protected _popTo() {
    Navigation.popTo(this.componentID);
  }

  /**
   * Resets the native navigation stack to a stack with only a single component.
   * The provided component.
   */
  protected _swapRoot<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfig<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ) {
    Navigation.setStackRoot(this.componentID, nextRoute.getLayout(props));
  }
}
