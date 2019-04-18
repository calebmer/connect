declare module "react-native-keyboard-tracking-view" {
  import {ViewProps} from "react-native";

  export class KeyboardTrackingView extends React.Component<ViewProps> {
    getNativeProps(): Promise<{
      trackingViewHeight: number;
      keyboardHeight: number;
      contentTopInset: number;
    }>;

    scrollToStart(): void;
  }
}
