import React from "react";

// const place = create({
//   routes: {
//     SignIn: {
//       component: () => import("../SignIn").then(m => m.SignIn),
//     },
//     SignUp: {
//       component: () => import("../SignUp").then(m => m.SignUp),
//     },
//   },
// });

// place.router.SignIn.push({x: 42});

// function create<RouterConfig extends StackRouterConfigBase>(
//   routes: RouterConfig,
// ): {
//   readonly router: StackRouter<RouterConfig["routes"]>;
// } {
//   return null as any;
// }

// type StackRouterConfigBase = {
//   readonly routes: {
//     readonly [key: string]: StackRouteConfigBase;
//   };
// };

// type StackRouteConfigBase = {
//   readonly component: () => Promise<React.ComponentType<never>>;
// };

// type StackRouteProps<
//   Route extends StackRouteConfigBase
// > = Route["component"] extends () => Promise<React.ComponentType<infer Props>>
//   ? Props
//   : never;

// type StackRouter<Routes extends StackRouterConfigBase["routes"]> = {
//   [Key in keyof Routes]: StackRouterRoute<Routes[Key]>
// };

// type StackRouterRoute<Route extends StackRouteConfigBase> = {
//   readonly push: (props: StackRouteProps<Route>) => void;
// };
