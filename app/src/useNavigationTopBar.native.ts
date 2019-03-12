import {Navigation} from "react-native-navigation";
import {Route} from "./router/Route.native";
import {useEffect} from "react";

export function useNavigationTopBar({
  route,
  visible,
}: {
  readonly route: Route;
  readonly visible: boolean;
}) {
  useEffect(() => {
    Navigation.mergeOptions(route.componentID, {
      topBar: {
        visible,
        drawBehind: true,
      },
    });
  }, [route.componentID, visible]);
}
