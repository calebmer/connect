// NOTE: The file name starts with “All” so that it appears first in an
// alphabetically sorted list.

import {Path} from "./Path";
import {RouteConfig} from "./Route";

export const SignInRoute = new RouteConfig({
  path: Path.create("sign-in"),
  component: () =>
    import(
      /* webpackChunkName: "SignIn" */
      "../auth/SignIn"
    ).then(m => m.SignIn),
});

export const SignUpRoute = new RouteConfig({
  path: Path.create("sign-up"),
  component: () =>
    import(
      /* webpackChunkName: "SignUp" */
      "../auth/SignUp"
    ).then(m => m.SignUp),
});

export const AccountTestRoute = new RouteConfig({
  path: Path.create("account"),
  component: () =>
    import(
      /* webpackChunkName: "AccountTest" */
      "../account/AccountTest"
    ).then(m => m.AccountTest),
});

export const GroupRoute = new RouteConfig({
  path: Path.create("group", Path.variable("groupSlug")),
  component: () =>
    import(
      /* webpackChunkName: "GroupHome" */
      "../group/GroupHome"
    ).then(m => m.GroupHomeRoute),
});

export const PostRoute = new RouteConfig({
  path: Path.create(
    "group",
    Path.variable("groupSlug"),
    "post",
    Path.variable("postID"),
  ),
  component: () =>
    import(
      /* webpackChunkName: "GroupHome" */
      "../group/GroupHome"
    ).then(m => m.GroupHomeRoute),
});

export const NewPostRoute = new RouteConfig({
  path: Path.create("group", Path.variable("groupSlug"), "new-post"),
  component: () =>
    import(
      /* webpackChunkName: "PostNewMobile" */
      "../post/PostNewMobile"
    ).then(m => m.PostNewMobile),
});
