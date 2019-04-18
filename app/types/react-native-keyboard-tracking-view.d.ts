declare module "react-native-keyboard-tracking-view" {
  import {ViewProps} from "react-native";

  export interface KeyboardTrackingViewProps extends ViewProps {
    scrollBehavior?:
      | "KeyboardTrackingScrollBehaviorNone"
      | "KeyboardTrackingScrollBehaviorScrollToBottomInvertedOnly"
      | "KeyboardTrackingScrollBehaviorFixedOffset";
    revealKeyboardInteractive?: boolean;
    manageScrollView?: boolean;
    requiresSameParentToManageScrollView?: boolean;
    addBottomView?: boolean;
    scrollToFocusedInput?: boolean;
    allowHitsOutsideBounds?: boolean;
  }

  export class KeyboardTrackingView extends React.Component<
    KeyboardTrackingViewProps
  > {
    getNativeProps(): Promise<{
      trackingViewHeight: number;
      keyboardHeight: number;
      contentTopInset: number;
    }>;

    scrollToStart(): void;
  }
}
