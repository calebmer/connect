import {BodyText, MetaLinkText} from "./atoms";
import React, {useEffect, useState} from "react";
import {SafeAreaView, TouchableOpacity, View} from "react-native";
import {API} from "./api/API";
import {AccountProfile} from "@connect/api-client";
import {Route} from "./router/Route";
import {SignInRoute} from "./router/AllRoutes";

export function AccountTest({route}: {route: Route}) {
  const [account, setAccount] = useState<undefined | AccountProfile>();

  useEffect(() => {
    API.account.getCurrentProfile().then(({account}) => setAccount(account));
  }, []);

  function handleSignOut() {
    API.account
      .signOut({refreshToken: "" as any}) // NOTE: sign-out is handled by our native/web API proxy.
      .then(() => route.nativeSwapRoot(SignInRoute, {}));
  }

  return (
    <SafeAreaView>
      <View style={{padding: 20}}>
        {account && (
          <>
            <BodyText>Hello {account.name}</BodyText>
            <TouchableOpacity onPress={handleSignOut}>
              <MetaLinkText>Sign Out</MetaLinkText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
