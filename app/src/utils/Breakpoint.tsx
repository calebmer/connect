import {Dimensions, ScaledSize} from "react-native";
import React, {useContext, useEffect, useState} from "react";

/**
 * Breakpoint screen sizes we watch for. We use breakpoints to change the UI
 * based on the type of device we are rendering on.
 *
 * These values are taken from the [Chrome Device Mode][1] simulator.
 *
 * [1]: https://developers.google.com/web/tools/chrome-devtools/device-mode/
 */
export enum Breakpoint {
  MobileSmall = 320,
  MobileMedium = 375,
  Mobile = 425,
  TabletSmall = 575,
  Tablet = 768,
  Laptop = 1024,
  LaptopMedium = 1180,
  LaptopLarge = 1440,
}

const _BreakpointContext = React.createContext<Breakpoint | null>(null);

/**
 * Context provider for breakpoints. Will update the context when the screen
 * size changes.
 */
export function BreakpointContext({children}: {children: React.Node}) {
  // Create a state variable which uses the current screen size.
  const [breakpoint, setBreakpoint] = useState(() => {
    return fromWidth(Dimensions.get("window").width);
  });

  useEffect(() => {
    let cancelled = false;

    // Update our breakpoint in case the screen size changed between React’s
    // render phase and commit phase.
    setBreakpoint(fromWidth(Dimensions.get("window").width));

    // Whenever the screen size changes, update the breakpoint!
    function handleChange({window}: {window: ScaledSize}) {
      if (cancelled) return; // A race condition means we might call this after removing the event listener.
      setBreakpoint(fromWidth(window.width));
    }

    Dimensions.addEventListener("change", handleChange);
    return () => {
      cancelled = true;
      Dimensions.removeEventListener("change", handleChange);
    };
  }, [breakpoint]);

  return (
    <_BreakpointContext.Provider value={breakpoint}>
      {children}
    </_BreakpointContext.Provider>
  );
}

/**
 * Returns true if we our width is less than or equal to the provided
 * breakpoint. Watches the screen size for changes and re-renders when we cross
 * the breakpoint threshold.
 */
export function useBreakpoint(): Breakpoint {
  const breakpoint = useContext(_BreakpointContext);

  if (breakpoint === null) {
    throw new Error(
      "You cannot call useBreakpoint() without adding a <BreakpointContext>",
    );
  }

  return breakpoint;
}

/**
 * Get the breakpoint from the current width.
 */
function fromWidth(width: number): Breakpoint {
  if (width <= Breakpoint.MobileSmall) {
    return Breakpoint.MobileSmall;
  } else if (width <= Breakpoint.MobileMedium) {
    return Breakpoint.MobileMedium;
  } else if (width <= Breakpoint.Mobile) {
    return Breakpoint.Mobile;
  } else if (width <= Breakpoint.TabletSmall) {
    return Breakpoint.TabletSmall;
  } else if (width <= Breakpoint.Tablet) {
    return Breakpoint.Tablet;
  } else if (width <= Breakpoint.Laptop) {
    return Breakpoint.Laptop;
  } else if (width <= Breakpoint.LaptopMedium) {
    return Breakpoint.LaptopMedium;
  } else {
    return Breakpoint.LaptopLarge;
  }
}
