import {Color, Shadow} from "../atoms";
import {StyleSheet, View} from "react-native";
import {ErrorScreen} from "../frame/ErrorScreen";
import {Post} from "./Post";
import {PostCache} from "./PostCache";
import {PostCommentsCache} from "../comment/CommentCache";
import {PostID} from "@connect/api-client";
import {PostMeasurements} from "./PostMeasurements";
import {PostShimmer} from "./PostShimmer";
import React from "react";
import {Route} from "../router/Route";

type Props = {
  route: Route;
  groupSlug: string;
  postID: PostID | null;
};

type State = {
  hasError: boolean;
  error: unknown;
};

export class PostContainer extends React.Component<Props, State> {
  state = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    // Don’t show the React error overlay if we’ve caught the error.
    if (__DEV__ && typeof error === "object" && error !== null) {
      (error as any).disableReactErrorOverlay = true;
    }

    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch() {
    // Seems like adding this will cause React to print the component stack.
  }

  handleRetry = () => {
    const {postID} = this.props;

    // Force ourselves to reload the post and comments before we retry.
    if (postID !== null) {
      PostCache.forceReload(postID);
      PostCommentsCache.forceReload(postID);
    }

    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const {route, groupSlug, postID} = this.props;
    const {hasError, error} = this.state;
    return (
      <View style={styles.container}>
        {hasError ? (
          <ErrorScreen route={route} error={error} onRetry={this.handleRetry} />
        ) : postID != null ? (
          <React.Suspense fallback={<PostShimmer route={route} />}>
            <Post route={route} groupSlug={groupSlug} postID={postID} />
          </React.Suspense>
        ) : (
          <PostShimmer route={route} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: Color.white,
    ...Shadow.elevation3,
    maxWidth: PostMeasurements.maxWidth,
  },
});
