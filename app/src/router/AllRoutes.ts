// NOTE: The file name starts with “All” so that it appears first in an
// alphabetically sorted list.

import {RouteConfig} from "./Route";

export const SignInRoute = new RouteConfig({
  path: "/sign-in",
  component: () => import("../SignIn").then(m => m.SignIn),
  defaultProps: {},
});

export const SignUpRoute = new RouteConfig({
  path: "/sign-up",
  component: () => import("../SignUp").then(m => m.SignUp),
  defaultProps: {},
});

export const AccountTestRoute = new RouteConfig({
  path: "/account",
  component: () => import("../AccountTest").then(m => m.AccountTest),
  defaultProps: {},
});

export const GroupRoute = new RouteConfig({
  path: "/group/nohello",
  component: () => import("../Group").then(m => m.Group),
  defaultProps: {},
});
