import {useRef} from "react";

/**
 * Use a constant value across all renders. We create the value in the first
 * render and use the same constant value in subsequent renders.
 */
export function useConstant<Constant>(make: () => Constant): Constant {
  const constant = useRef<null | Constant>(null);
  if (constant.current === null) constant.current = make();
  return constant.current;
}
