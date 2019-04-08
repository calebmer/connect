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
      return function RouteRoot({
        componentId: componentID,
        componentModalRoot = false,
        ...props
      }) {
        // Create the lazy component element with all the appropriate props.
        // Make sure to use the default props object in case some of our
        // required props were not provided!
        const route = useMemo(() => {
          return new Route({componentID, componentModalRoot});
        }, [componentID, componentModalRoot]);

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
  private readonly componentModalRoot: boolean;

  constructor({
    componentID,
    componentModalRoot,
  }: {
    componentID: string;
    componentModalRoot: boolean;
  }) {
    super();
    this.componentID = componentID;
    this.componentModalRoot = componentModalRoot;
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
    if (!this.componentModalRoot) {
      Navigation.pop(this.componentID);
    } else {
      Navigation.dismissModal(this.componentID);
    }
  }

  /**
   * Pops routes off the navigation stack until we return to this route.
   */
  protected _popTo() {
    Navigation.popTo(this.componentID);
  }

  /**
   * Push a new route since we don’t have any native equivalent for replace.
   */
  protected _webReplace<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfig<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ): void {
    this._push(nextRoute, props);
  }

  /**
   * Resets the native navigation stack to a stack with only a single component.
   * The provided component.
   */
  protected _nativeSwapRoot<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfig<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ) {
    Navigation.setStackRoot(this.componentID, nextRoute.getLayout(props));
  }

  /**
   * Shows a modal on top of the current stack. While technically a modal
   * creates a _new_ navigation stack, we still take care to provide an API
   * which feels like we are still in the same navigation stack. As such calling
   * `pop()` on a modal route will call `Navigation.dismissModal()` implicitly.
   */
  protected _nativeShowModal<
    NextPath extends PathBase,
    NextProps extends {readonly route: RouteBase} & PathVariableProps<NextPath>
  >(
    nextRoute: RouteConfig<NextPath, NextProps>,
    props: Omit<NextProps, "route">,
  ) {
    Navigation.showModal({
      stack: {
        children: [nextRoute.getLayout({...props, componentModalRoot: true})],
      },
    });
  }

  /**
   * Was this route pushed as a modal route? Will be true for routes created
   * with `nativeShowModal()`.
   */
  public nativeIsModalRoot(): boolean {
    return this.componentModalRoot;
  }
}
