import {AccountCache, useCurrentAccount} from "../account/AccountCache";
import {Color, Font, LabelText, MetaText, Shadow, Space} from "../atoms";
import {GroupID, GroupMember} from "@connect/api-client";
import {GroupMembersCache, GroupSlugCache} from "./GroupCache";
import {ScrollView, StyleSheet, View} from "react-native";
import {AccountAvatarSmall} from "../account/AccountAvatarSmall";
import {ErrorBoundary} from "../frame/ErrorBoundary";
import React from "react";
import {Route} from "../router/Route";
import {Trough} from "../molecules/Trough";
import {useCache} from "../cache/Cache";

function GroupMemberSidebarContainer({
  route,
  groupSlug,
}: {
  route: Route;
  groupSlug: string;
}) {
  const groupID = useCache(GroupSlugCache, groupSlug);

  return (
    <View style={styles.sidebar}>
      <ErrorBoundary
        route={route}
        onRetry={() => GroupMembersCache.forceReload(groupID)}
      >
        <GroupMemberSidebar groupID={groupID} />
      </ErrorBoundary>
    </View>
  );
}

const GroupMemberSidebarContainerMemo = React.memo(GroupMemberSidebarContainer);
export {GroupMemberSidebarContainerMemo as GroupMemberSidebar};

function GroupMemberSidebar({groupID}: {groupID: GroupID}) {
  const members = useCache(GroupMembersCache, groupID);
  const currentAccount = useCurrentAccount();

  // Uh oh! This is a side-effect in render. The better solution would be to
  // setup some subscription on the clock so that when the time changes we can
  // update the component. This works for now, though.
  const currentTime = new Date();

  return (
    <ScrollView>
      <Trough title="Members" hideTopShadow paddingHorizontal={padding} />
      <View style={styles.container}>
        {members.map(member =>
          currentAccount.id === member.accountID ? null : (
            <GroupMemberSidebarItem
              key={member.accountID}
              member={member}
              currentTime={currentTime}
            />
          ),
        )}
      </View>
      <Trough hideBottomShadow paddingHorizontal={padding} />
    </ScrollView>
  );
}

function GroupMemberSidebarItem({
  member,
  currentTime,
}: {
  member: GroupMember;
  currentTime: Date;
}) {
  const account = useCache(AccountCache, member.accountID);

  return (
    <View style={styles.member}>
      <AccountAvatarSmall style={styles.memberAvatar} account={account} />
      <View style={styles.memberDetails}>
        <LabelText numberOfLines={1}>{account.name}</LabelText>
        <MetaText numberOfLines={1}>
          joined {displayHowLongAgo(currentTime, new Date(member.joinedAt))}
        </MetaText>
      </View>
    </View>
  );
}

// NOTE: This function was mostly copied from `communicateTime()`. We should
// find a way to unify the logic...
function displayHowLongAgo(currentTime: Date, time: Date): string {
  const millisecondsAgo = currentTime.getTime() - time.getTime();
  const daysAgo = millisecondsAgo / 1000 / 60 / 60 / 24;

  if (currentTime.getFullYear() !== time.getFullYear()) {
    const n = currentTime.getFullYear() - time.getFullYear();
    return `${n} year${n === 1 ? "" : "s"} ago`;
  }

  if (currentTime.getMonth() !== time.getMonth() && daysAgo >= 30) {
    const n = currentTime.getMonth() - time.getMonth();
    return `${n} month${n === 1 ? "" : "s"} ago`;
  }

  if (currentTime.getDate() !== time.getDate()) {
    const n = Math.max(1, Math.floor(daysAgo));
    if (n === 1) {
      return "yesterday";
    } else {
      return `${n} day${n === 1 ? "" : "s"} ago`;
    }
  }

  return "today";
}

const padding = Space.space2;

const styles = StyleSheet.create({
  sidebar: {
    flex: 1 / 5,
    zIndex: 1,
    backgroundColor: Trough.backgroundColor,
    maxWidth: Space.space11,
    ...Shadow.elevation2,
  },
  container: {
    paddingHorizontal: padding,
    paddingVertical: padding / 2,
    backgroundColor: Color.white,
  },
  member: {
    flexDirection: "row",
    paddingVertical: padding / 2,
  },
  memberAvatar: {
    position: "relative",
    top: Font.size2.lineHeight - AccountAvatarSmall.size / 2 - 1,
  },
  memberDetails: {
    paddingLeft: padding,
  },
});
