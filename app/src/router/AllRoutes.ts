// NOTE: The file name starts with “All” so that it appears first in an
// alphabetically sorted list.

import {Path} from "./Path";
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
  path: Path.create("group", Path.variable("slug")),
  component: () => import("../Group").then(m => m.Group),
});
