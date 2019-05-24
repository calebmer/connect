import {BreakpointContext} from "../utils/Breakpoint";
import React from "react";

export function RouteContainer({children}: {children: React.Node}) {
  return (
    <BreakpointContext>
      <React.Suspense fallback={null}>{children}</React.Suspense>
    </BreakpointContext>
  );
}
