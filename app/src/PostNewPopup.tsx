import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {Border, Color, Font, Icon, IconName, Shadow, Space} from "./atoms";
import {Editor, EditorInstance} from "./Editor";
import React, {useEffect, useReducer, useRef, useState} from "react";
import {PostNewHeader} from "./PostNewHeader";
import {useConstant} from "./useConstant";
import {useCurrentAccount} from "./cache/AccountCache";

// The default width and height of our editor.
PostNewPopup.width = Font.maxWidth;
PostNewPopup.height = Space.space15;

// When the editor is minimized we will use this width.
PostNewPopup.minimizedWidth = Space.space12;

// The height of our editor’s title bar.
PostNewPopupTitleBar.height = Font.size1.fontSize + Space.space2 * 2;

/**
 * The state of our popup. We keep track of the current state type and the
 * offset/width for each state.
 */
type PostNewPopupState = {
  /** Is our popup opened or closed? */
  type: "OPENED" | "MINIMIZED" | "CLOSED";
  /** Is our popup currently animating? */
  animating: boolean;
  /** What is our popup’s offset from the bottom of the screen? */
  offset: number;
  /** What is the width of our popup? */
  width: number;
};

/** An action which we trigger to change the state of our popup. */
type PostNewPopupAction =
  | {type: "MINIMIZE"}
  | {type: "MAXIMIZE"}
  | {type: "CLOSE"}
  | {type: "ANIMATION_DONE"};

/** The initial state of our popup. */
const initialState: PostNewPopupState = {
  type: "OPENED",
  animating: true,
  offset: PostNewPopup.height,
  width: PostNewPopup.width,
};

/** Update our state based on an incoming action. */
function reducer(
  state: PostNewPopupState,
  action: PostNewPopupAction,
): PostNewPopupState {
  switch (action.type) {
    case "MINIMIZE":
      return {
        type: "MINIMIZED",
        animating: true,
        offset: PostNewPopupTitleBar.height,
        width: PostNewPopup.minimizedWidth,
      };
    case "MAXIMIZE":
      return {
        type: "OPENED",
        animating: true,
        offset: PostNewPopup.height,
        width: PostNewPopup.width,
      };
    case "CLOSE": {
      return {
        type: "CLOSED",
        animating: true,
        offset: 0,
        width: state.width, // When closing the popup we keep the current width.
      };
    }
    case "ANIMATION_DONE":
      return state.animating ? {...state, animating: false} : state;
    default: {
      const never: never = action;
      throw new Error(`Unexpected type: ${never["type"]}`);
    }
  }
}

/**
 * The popup component renders the popup and manages its various animations as
 * effects which react to the component state.
 */
export function PostNewPopup({onClose}: {onClose: () => void}) {
  const currentAccount = useCurrentAccount();

  // Get a reference to our editor...
  const editor = useRef<EditorInstance>(null);

  // Setup our component state...
  const [state, dispatch] = useReducer(reducer, initialState);

  // Setup our animated values...
  const translateY = useConstant(() => new Animated.Value(PostNewPopup.height));
  const width = useConstant(() => new Animated.Value(PostNewPopup.width));

  // Whenever the popup opens, we want to focus the editor.
  //
  // NOTE: On the web we have to prevent our container from scrolling when we
  // focus an offscreen element. We do so in `GroupHomeContainer.web.tsx`.
  useEffect(() => {
    if (state.type === "OPENED") {
      if (editor.current) {
        editor.current.focus();
      }
    }
  }, [state.type]);

  // When the popup closes we need to call our `onClose` callback which will
  // remove our popup from the view hierarchy.
  useEffect(() => {
    if (!state.animating && state.type === "CLOSED") {
      onClose();
    }
  }, [onClose, state.animating, state.type]);

  // When our state changes trigger our animations in response. When the
  // animation finishes let our state know.
  useEffect(() => {
    if (!state.animating) {
      translateY.setValue(PostNewPopup.height - state.offset);
      return;
    } else {
      const animation = Animated.parallel([
        Animated.spring(translateY, {
          toValue: PostNewPopup.height - state.offset,
          friction: 10,
          tension: 55,
          overshootClamping: true,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.spring(width, {
          toValue: state.width,
          friction: 10,
          tension: 55,
          overshootClamping: true,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]);

      animation.start(({finished}) => {
        if (finished) {
          dispatch({type: "ANIMATION_DONE"});
        }
      });

      return () => {
        animation.stop();
      };
    }
  }, [state.animating, state.offset, state.width, translateY, width]);

  return (
    <Animated.View
      style={[styles.container, {width, transform: [{translateY}]}]}
    >
      <PostNewPopupTitleBar
        minimized={state.type === "MINIMIZED"}
        onMinimizeToggle={() => {
          if (state.type === "MINIMIZED") {
            dispatch({type: "MAXIMIZE"});
          } else {
            dispatch({type: "MINIMIZE"});
          }
        }}
        onClose={() => dispatch({type: "CLOSE"})}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <PostNewHeader currentAccount={currentAccount} />
        <Editor ref={editor} placeholder="Start a conversation…" />
      </ScrollView>
    </Animated.View>
  );
}

function PostNewPopupTitleBar({
  minimized,
  onMinimizeToggle,
  onClose,
}: {
  minimized: boolean;
  onMinimizeToggle: () => void;
  onClose: () => void;
}) {
  return (
    <TouchableWithoutFeedback
      disabled={!minimized}
      accessible={false}
      onPress={onMinimizeToggle}
    >
      <View style={styles.titleBar}>
        <Text style={styles.title} selectable={false} numberOfLines={1}>
          New Post
        </Text>
        <View style={styles.titleBarButtons}>
          <PostNewPopupTitleBarButton
            icon={minimized ? "chevron-up" : "chevron-down"}
            onPress={onMinimizeToggle}
          />
          <PostNewPopupTitleBarButton icon="x" onPress={onClose} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

function PostNewPopupTitleBarButton({
  icon,
  onPress,
}: {
  icon: IconName;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const active = hovered || focused;

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {/* We need the <View> because <TouchableWithoutFeedback> works by calling
          `React.cloneElement()` with the correct props. */}
      <View
        style={[styles.titleBarButton, active && styles.titleBarButtonActive]}
        accessibilityRole="button"
      >
        <Icon name={icon} color={active ? Color.white : Color.grey2} />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    right: Space.space6,
    overflow: "hidden",
    width: PostNewPopup.width,
    height: PostNewPopup.height,
    borderTopLeftRadius: Border.radius1,
    borderTopRightRadius: Border.radius1,
    backgroundColor: Color.white,
    ...Shadow.elevation4,
  },
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: PostNewPopupTitleBar.height,
    backgroundColor: Color.grey7,
  },
  title: {
    padding: Space.space2,
    color: Color.grey0,
    ...Font.sans,
    ...Font.size1,
    lineHeight: Font.size1.fontSize,
  },
  titleBarButtons: {
    flexDirection: "row",
    paddingHorizontal: Space.space2 - Space.space0,
  },
  titleBarButton: {
    padding: Space.space0 / 2,
    margin: Space.space0 / 2,
    borderRadius: 100,
    outlineWidth: 0,
  },
  titleBarButtonActive: {
    backgroundColor: Color.grey5,
  },
  content: {
    flex: 1,
    width: PostNewPopup.width,
  },
});
