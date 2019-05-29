import {
  BodyLinkText,
  BodyText,
  Color,
  Font,
  MetaLinkText,
  Space,
  TitleText,
} from "../atoms";
import {CurrentGroupMembershipsCache, GroupCache} from "../group/GroupCache";
import {GroupRoute, SignInRoute} from "../router/AllRoutes";
import React, {useEffect} from "react";
import {ScrollView, StyleSheet, TouchableOpacity, View} from "react-native";
import {API} from "../api/API";
import {GroupID} from "@connect/api-client";
import {Route} from "../router/Route";
import {StrokeLayout} from "../frame/StrokeLayout";
import {useCache} from "../cache/Cache";
import {useCacheSingletonData} from "../cache/CacheSingleton";
import {useCurrentAccount} from "./AccountCache";

export function AccountHomeAlpha({route}: {route: Route}) {
  CurrentGroupMembershipsCache.preload();

  const account = useCurrentAccount();
  const groupIDs = useCacheSingletonData(CurrentGroupMembershipsCache);

  function handleSignOut() {
    API.account
      .signOut({refreshToken: "" as any}) // NOTE: sign-out is handled by our native/web API proxy.
      .then(() => route.nativeSwapRoot(SignInRoute, {}));
  }

  // Preload the group and post route components. It is very likely that’s where
  // the user will be going next.
  useEffect(() => {
    GroupRoute.loadComponent();
  }, []);

  return (
    <StrokeLayout>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Account section */}
          <TitleText>Account</TitleText>
          <View style={styles.spacerSmall} />
          <BodyText style={styles.bodyText}>
            Hello {account.name}! Welcome to the Connect Alpha, we hope you
            enjoy the product as much as we do. This is a work-in progress page
            for navigating between your groups.{"\n\n"}You can email any
            feedback directly to caleb@connect.ink
          </BodyText>
          <View style={styles.spacerSmall} />
          <TouchableOpacity onPress={handleSignOut}>
            <MetaLinkText>Sign Out</MetaLinkText>
          </TouchableOpacity>
          <View style={styles.spacerLarge} />

          {/* Group memberships section */}
          <TitleText>Groups</TitleText>
          <View style={styles.spacerSmall} />
          {groupIDs.length === 0 ? (
            <BodyText>
              You aren’t a member of any groups 😔{"\n"}Ask for an invite!
            </BodyText>
          ) : (
            groupIDs.map(groupID => (
              <GroupLink key={groupID} route={route} groupID={groupID} />
            ))
          )}
        </View>
      </ScrollView>
    </StrokeLayout>
  );
}

function GroupLink({route, groupID}: {route: Route; groupID: GroupID}) {
  const group = useCache(GroupCache, groupID);
  return (
    <View style={styles.link}>
      <BodyText selectable={false}>{"• "}</BodyText>
      <TouchableOpacity
        onPress={() =>
          route.push(GroupRoute, {
            groupSlug: group.slug || group.id,
          })
        }
      >
        <BodyLinkText>{group.name}</BodyLinkText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Color.white,
  },
  container: {
    padding: Space.space4,
  },
  bodyText: {
    maxWidth: Font.maxWidth,
  },
  spacerSmall: {
    height: Space.space0,
  },
  spacerLarge: {
    height: Space.space5,
  },
  link: {
    flexDirection: "row",
  },
});
