import {AccountCache, useCurrentAccount} from "../account/AccountCache";
import {Color, Font, LabelText, MetaText, Shadow, Space} from "../atoms";
import {GroupMembersCache, GroupSlugCache} from "./GroupCache";
import {ScrollView, StyleSheet, View} from "react-native";
import {AccountAvatarSmall} from "../account/AccountAvatarSmall";
import {GroupMember} from "@connect/api-client";
import React from "react";
import {Trough} from "../molecules/Trough";
import {useCache} from "../cache/Cache";

export function GroupMemberSidebar({groupSlug}: {groupSlug: string}) {
  const groupID = useCache(GroupSlugCache, groupSlug);
  const members = useCache(GroupMembersCache, groupID);
  const currentAccount = useCurrentAccount();

  return (
    <View style={styles.sidebar}>
      <ScrollView>
        <Trough title="Members" hideTopShadow paddingHorizontal={padding} />
        <View style={styles.container}>
          {members.map(member =>
            currentAccount.id === member.accountID ? null : (
              <GroupMemberItem key={member.accountID} member={member} />
            ),
          )}
        </View>
        <Trough hideBottomShadow paddingHorizontal={padding} />
      </ScrollView>
    </View>
  );
}

function GroupMemberItem({member}: {member: GroupMember}) {
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
