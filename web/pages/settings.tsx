import React from "react";
import {API} from "../src/API";
import {BodyText} from "../src/atoms";

type Props = {
  readonly displayName: string;
};

AccountSettings.getInitialProps = async (): Promise<Props> => {
  const {displayName} = await API.account.getCurrentProfile({}, {});
  return {displayName};
};

function AccountSettings({displayName}: Props) {
  return <BodyText>Hello {displayName}!</BodyText>;
}

export default AccountSettings;
