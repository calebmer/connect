import {Route} from "./router";

export function useNavigationTopBar(options: {
  readonly route: Route;
  readonly visible: boolean;
}): void;
