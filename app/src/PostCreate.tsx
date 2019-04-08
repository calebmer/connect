import {NavbarNativeScrollView} from "./NavbarNativeScrollView";
import React from "react";
import {Route} from "./router/Route";

export function PostCreate({route}: {route: Route}) {
  return (
    <NavbarNativeScrollView route={route} useTitle={() => "New Post"}>
      {/* TODO */}
    </NavbarNativeScrollView>
  );
}
