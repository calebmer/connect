import {useReducer} from "react";

/**
 * Returns a function which forces our component to re-render. Useful if you
 * have refs which need to be updated.
 *
 * If you need to use this function then just know you’re very likely breaking
 * the rules of React so try to avoid it when possible.
 */
export function useForceUpdate(): () => void {
  return useReducer(state => !state, true)[1] as () => void;
}
