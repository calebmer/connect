import {Breakpoint, useBreakpoint} from "../utils/Breakpoint";

/**
 * Should we use the layered group home layout?
 */
export function useGroupHomeLayout() {
  return useBreakpoint() > Breakpoint.TabletSmall;
}
