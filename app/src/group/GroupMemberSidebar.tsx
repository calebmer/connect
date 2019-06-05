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

  return (
    <ScrollView>
      <Trough title="Members" hideTopShadow paddingHorizontal={padding} />
      <View style={styles.container}>
        {members.map(member =>
          currentAccount.id === member.accountID ? null : (
            <GroupMemberSidebarItem key={member.accountID} member={member} />
          ),
        )}
      </View>
      <Trough hideBottomShadow paddingHorizontal={padding} />
    </ScrollView>
  );
}

function GroupMemberSidebarItem({member}: {member: GroupMember}) {
  const account = useCache(AccountCache, member.accountID);

  return (
    <View style={styles.member}>
      <AccountAvatarSmall style={styles.memberAvatar} account={account} />
      <View style={styles.memberDetails}>
        <LabelText numberOfLines={1}>{account.name}</LabelText>
        <MetaText numberOfLines={1}>{member.joinedAt}</MetaText>
      </View>
    </View>
  );
}

const padding = Space.space2;

const styles = StyleSheet.create({
  sidebar: {
    zIndex: 1,
    backgroundColor: Trough.backgroundColor,
    width: Space.space11,
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
