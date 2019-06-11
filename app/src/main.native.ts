import {AccountHomeAlphaRoute, SignInRoute} from "./router/AllRoutes";
import {API} from "./api/API";
import {Color} from "./atoms";
import {Navigation} from "react-native-navigation";
import {YellowBox} from "react-native";
import {loadTokensFromStorage} from "./api/API.native";

// TODO: Maybe don’t initialize Firebase in the main module?
import firebase from "react-native-firebase";

// Load our authentication tokens from storage.
let isAuthenticated: Promise<boolean> | boolean = loadTokensFromStorage();

// When we’ve finished loading our authentication tokens, update the
// `isAuthenticated` variable so we can have synchronous access.
isAuthenticated.then(
  _isAuthenticated => (isAuthenticated = _isAuthenticated),
  () => (isAuthenticated = false),
);

// Once the app has launched...
Navigation.events().registerAppLaunchedListener(() => {
  // Wait until we’ve attempted to load our tokens for app storage and call our
  // main function letting it know if we are authenticated or not.
  if (typeof isAuthenticated === "boolean") {
    main(isAuthenticated);
  } else {
    isAuthenticated.then(
      _isAuthenticated => main(_isAuthenticated),
      () => main(false),
    );
  }
});

/**
 * Run our application! We will choose the initial route to render based on
 * whether an account is authenticated in the app or not.
 */
function main(isAuthenticated: boolean) {
  Navigation.setDefaultOptions({
    topBar: {
      visible: false,
    },
    layout: {
      backgroundColor: Color.grey8,
    },
  });

  Navigation.setRoot({
    root: {
      stack: {
        children: [
          (isAuthenticated
            ? (AccountHomeAlphaRoute as any)
            : (SignInRoute as any)
          ).getLayout({
            componentStackRoot: true,
          }),
        ],
      },
    },
  }).then(navigationDidMount);
}

function navigationDidMount() {
  // TODO: Fix this so that we actually store the token.
  firebase
    .messaging()
    .getToken()
    .then(token => alert(token));
}
//token => API.account.setDeviceToken(token)
YellowBox.ignoreWarnings([
  // Do more investigation as to why this warning shows up. I’ve (Caleb) seen it
  // on multiple projects, though and it doesn’t seem to mean much. Only that an
  // image in a virtualized list was unmounted or something.
  "Task orphaned",
  // React Native Firebase uses module cycles in its codebase. Ignore the
  // require cycle warnings specifically for React Native Firebase.
  "Require cycle: app/node_modules/react-native-firebase",
]);
