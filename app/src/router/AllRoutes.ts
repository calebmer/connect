// NOTE: The file name starts with “All” so that it appears first in an
// alphabetically sorted list.

import {Path} from "./Path";
import {Platform} from "react-native";
import {RouteConfig} from "./Route";

export const SignInRoute = new RouteConfig({
  path: Path.create("sign-in"),
  component: () => import("../SignIn").then(m => m.SignIn),
});

export const SignUpRoute = new RouteConfig({
  path: Path.create("sign-up"),
  component: () => import("../SignUp").then(m => m.SignUp),
});

export const AccountTestRoute = new RouteConfig({
  path: Path.create("account"),
  component: () => import("../AccountTest").then(m => m.AccountTest),
});

export const GroupRoute = new RouteConfig({
  path: Path.create("group", Path.variable("groupSlug")),
  component: () =>
    Platform.OS === "web"
      ? import("../GroupHomeWeb.web").then(m => m.GroupHomeWeb)
      : import("../Group").then(m => m.GroupRoute),
});

export const PostRoute = new RouteConfig({
  path: Path.create(
    "group",
    Path.variable("groupSlug"),
    "post",
    Path.variable("postID"),
  ),
  component: () =>
    Platform.OS === "web"
      ? import("../GroupHomeWeb.web").then(m => m.GroupHomeWeb)
      : import("../Post").then(m => m.PostRoute),
});
