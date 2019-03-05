import React from "react";

createStack({
  SignIn: React.lazy(() => import("../SignIn").then(m => m.SignIn)),
  SignUp: React.lazy(() => import("../SignUp").then(m => m.SignUp)),
});

function createStack<
  Routes extends {
    readonly [key: string]: () => Promise<React.ComponentType<{}>>;
  }
>(routes: Routes) {}
