import React, {ReactNode} from "react";

export function RouteRoot({children}: {children: ReactNode}) {
  return <React.Suspense fallback={null}>{children}</React.Suspense>;
}
