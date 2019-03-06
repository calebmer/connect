// NOTE: The file name starts with “All” so that it appears first in an
// alphabetically sorted list.

import {RouteConfig} from "./Route";

export const SignInRoute = new RouteConfig({
  path: "/sign-in",
  component: () => import("../SignIn").then(m => m.SignIn),
});

export const SignUpRoute = new RouteConfig({
  path: "/sign-up",
  component: () => import("../SignUp").then(m => m.SignUp),
});
