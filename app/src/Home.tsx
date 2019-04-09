import React, {useEffect, useMemo, useState} from "react";
import {API} from "./api/API";
import {AccountProfile} from "@connect/api-client";
import {Layout} from "./Layout";
import {TitleText} from "./atoms/Text";

export function Home() {
  const [profile, setAccount] = useState<AccountProfile>({});
  const groups = useMemo(
    () => [
      "Nohello",
      "The Art of doing twice the work in half the time",
      "Funky Buddah Brewery",
    ],
    [],
  );
  useEffect(() => {
    try {
      API.account.getCurrentProfile().then(response => {
        const data = {
          ...response.account,
          groups,
        };
        setAccount(data);
      });
    } catch (e) {
      // Handle Error if the API fails to respond with correct data
    }
  }, [groups]);
  return (
    <Layout>
      <TitleText>Hey, {profile.name}.</TitleText>
    </Layout>
  );
}
