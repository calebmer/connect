// Use TypeScript [declaration merging][1] to change some of the React types.
//
// [1]: https://www.typescriptlang.org/docs/handbook/declaration-merging.html

import "react";

declare module "react" {
  /**
   * The type of any node in React. The React typings already export a type
   * named `ReactNode`, but I’d like to access this type as `React.Node`.
   */
  export type Node = ReactNode;

  /**
   * Enables the unstable React Concurrent Mode.
   */
  export const unstable_ConcurrentMode: ComponentType<{}>;
}
