import {Layout, Navigation} from "react-native-navigation";
import {RouteBase, RouteConfigBase} from "./RouteBase";
import React from "react";

// Utility type for removing keys from an object.
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

/**
 * Registers a route component with `react-native-navigation` and manages the
 * options we’ll pass to `react-native-navigation` when rendering the route.
 */
export class RouteConfig<
  Props extends {readonly route: RouteBase}
> extends RouteConfigBase<Props> {
  /**
   * Registers the component with `react-native-navigation`. Converts a
   * `componentId` into a `Route`.
   */
  protected registerComponent(LazyComponent: React.ComponentType<Props>): void {
    const defaultProps = this.defaultProps;

    // Register the navigation component at our route’s path.
    Navigation.registerComponent(this.path, () => {
      return function RouteRoot({componentId, ...props}) {
        // Create the lazy component element with all the appropriate props.
        // Make sure to use the default props object in case some of our
        // required props were not provided!
        const element = React.createElement(LazyComponent, {
          ...defaultProps,
          ...props,
          route: new Route(componentId),
        });

        // We need to wrap our lazy component in `<React.Suspense>` to handle
        // the `LazyComponent` suspend.
        return React.createElement(React.Suspense, {fallback: null}, element);
      };
    });
  }

  /**
   * Gets the `react-native-navigation` layout.
   */
  public getLayout(partialProps: Partial<Omit<Props, "route">>): Layout {
    return {
      component: {
        name: this.path,
        passProps: partialProps,
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
  protected _push<NextProps extends {readonly route: RouteBase}>(
    nextRoute: RouteConfig<NextProps>,
    partialProps: Partial<Omit<NextProps, "route">>,
  ) {
    Navigation.push(this.componentID, nextRoute.getLayout(partialProps));
  }

  /**
   * Pops routes off the navigation stack until we return to this route.
   */
  public popTo() {
    Navigation.popTo(this.componentID);
  }
}
