import {Layout, Navigation} from "react-native-navigation";
import {RouteBase, RouteConfigBase} from "./RouteBase";
import React from "react";
import {RouteRoot} from "./RouteRoot.native";

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
  protected registerComponent(
    LazyComponent: React.LazyExoticComponent<React.ComponentType<Props>>,
  ): void {
    Navigation.registerComponent(this.path, () => {
      return function NavigationComponent({componentId, ...props}) {
        // `...props` is a new object so it is ok to mutate it.
        props.route = new Route(componentId);
        const child = React.createElement(LazyComponent, props);

        // We need to wrap our lazy component in `<RouteRoot>` which includes
        // Suspense handling code.
        return React.createElement(RouteRoot, null, child);
      };
    });
  }

  /**
   * Gets the `react-native-navigation` layout.
   */
  getLayout(props: Pick<Props, Exclude<keyof Props, "route">>): Layout {
    return {
      component: {
        name: this.path,
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
  push<NextProps extends {readonly route: RouteBase}>(
    nextRoute: RouteConfig<NextProps>,
    props: Pick<NextProps, Exclude<keyof NextProps, "route">>,
  ) {
    Navigation.push(this.componentID, nextRoute.getLayout(props));
  }

  /**
   * Pops routes off the navigation stack until we return to this route.
   */
  popTo() {
    Navigation.popTo(this.componentID);
  }
}
