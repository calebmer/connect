import React, {useEffect, useState} from "react";
import {Text, View} from "react-native";
import {API} from "./api/API";
import {AccountProfile} from "@connect/api-client";

export function AccountTest() {
  const [account, setAccount] = useState<undefined | AccountProfile>();

  useEffect(() => {
    API.account.getCurrentAccountProfile().then(setAccount);
  }, []);

  return (
    <View style={{padding: 20}}>
      {account && <Text>Hello {account.name}</Text>}
    </View>
  );
}
