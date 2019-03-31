import React, {useEffect, useState} from "react";
import {API} from "./api/API";
import {AccountProfile} from "@connect/api-client";
import {Layout} from "./Layout";
import {TitleText} from "./atoms/Text";

export function Home() {
  const [profile, setAccount] = useState<AccountProfile>({});
  useEffect(() => {
    try {
      API.account.getCurrentProfile().then(response => {
        setAccount(response.account);
      });
    } catch (e) {
      // Handle Error if the API fails to respond with correct data
    }
  }, []);

  return (
    <Layout>
      <TitleText>Hey, {profile.name}.</TitleText>
    </Layout>
  );
}
