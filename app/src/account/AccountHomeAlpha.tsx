import {
  BodyLinkText,
  BodyText,
  Color,
  Font,
  MetaLinkText,
  Space,
  TitleText,
} from "../atoms";
import {GroupCache, GroupSlugCache} from "../group/GroupCache";
import {GroupRoute, SignInRoute} from "../router/AllRoutes";
import React, {useEffect, useState} from "react";
import {ScrollView, StyleSheet, TouchableOpacity, View} from "react-native";
import {API} from "../api/API";
import {ErrorAlert} from "../frame/ErrorAlert";
import {Group} from "@connect/api-client";
import {Route} from "../router/Route";
import {StrokeLayout} from "../frame/StrokeLayout";
import {useCurrentAccount} from "./AccountCache";

export function AccountHomeAlpha({route}: {route: Route}) {
  const account = useCurrentAccount();
  const [groups, setGroups] = useState<null | ReadonlyArray<Group>>(null);

  function handleSignOut() {
    API.account
      .signOut({refreshToken: "" as any}) // NOTE: sign-out is handled by our native/web API proxy.
      .then(() => route.nativeSwapRoot(SignInRoute, {}));
  }

  // Loads all the groups the current account is a member of...
  useEffect(() => {
    API.account
      .getCurrentGroupMemberships()
      .then(({groups}) => {
        groups.forEach(group => {
          GroupCache.insert(group.id, group);
          GroupSlugCache.insert(group.id, group.id);
          if (group.slug) GroupSlugCache.insert(group.slug, group.id);
        });
        setGroups(groups);
      })
      .catch(error => {
        ErrorAlert.alert("Could not get your group memberships", error);
      });
  }, []);

  return (
    <ScrollView style={styles.scrollView}>
      <StrokeLayout>
        <View style={styles.container}>
          {/* Account section */}
          <TitleText>Account</TitleText>
          <View style={styles.spacerSmall} />
          <BodyText style={styles.bodyText}>
            Hello {account.name}! Welcome to the Connect Alpha, we hope you
            enjoy the product as much as we do. This is a work-in progress page
            for navigating between your groups.{"\n\n"}You can email any
            feedback directly to calebmeredith8@gmail.com
          </BodyText>
          <View style={styles.spacerSmall} />
          <TouchableOpacity onPress={handleSignOut}>
            <MetaLinkText>Sign Out</MetaLinkText>
          </TouchableOpacity>
          <View style={styles.spacerLarge} />

          {/* Group memberships section */}
          <TitleText>Groups</TitleText>
          <View style={styles.spacerSmall} />
          {groups === null ? (
            <BodyText>Loading...</BodyText>
          ) : groups.length === 0 ? (
            <BodyText>
              You aren’t a member of any groups 😔{"\n"}Ask for an invite!
            </BodyText>
          ) : (
            <BodyText>
              {groups.map(group => (
                <BodyText key={group.id}>
                  •{" "}
                  <TouchableOpacity
                    onPress={() =>
                      route.push(GroupRoute, {
                        groupSlug: group.slug || group.id,
                      })
                    }
                  >
                    <BodyLinkText>{group.name}</BodyLinkText>
                  </TouchableOpacity>
                  {"\n"}
                </BodyText>
              ))}
            </BodyText>
          )}
        </View>
      </StrokeLayout>
    </ScrollView>
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
});
