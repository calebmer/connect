import React from "react";
import {NextContext} from "next";
import {APIAuth} from "@connect/api-client";

/**
 * Context provided when loading data for a route.
 */
export type RouteContext = {
  /**
   * The authorization context for the route. If no
   */
  readonly auth: APIAuth | undefined;
};

export type RouteConfig<Props> = {
  readonly load: (ctx: RouteContext) => Props | Promise<Props>;
  readonly render: React.FC<Props>;
};

export const Route = {
  create: createRoute,
};

function createRoute<Props>(
  config: RouteConfig<Props>,
): React.ComponentType<Props> {
  function getInitialProps(nextContext: NextContext) {
    // TODO: Put this in another file so that the `cookie` module is not bundled
    // into client code.
    if (!(process as any).browser) {
      const authorizationHeader = nextContext.req!.headers.authorization;
      const accessToken = authorizationHeader
        ? require("cookie").parse(authorizationHeader).access_token
        : undefined;
      const auth: APIAuth = {
        getAccessToken: () => accessToken,
      };
      return config.load({auth});
    } else {
      const auth: APIAuth = {
        getAccessToken: () => {}, // noop, handled by our API proxy.
      };
      return config.load({auth});
    }
  }

  function Route(props: Props) {
    return config.render(props);
  }

  Route.getInitialProps = getInitialProps;

  return Route;
}
