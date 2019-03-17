import {AccountTestRoute, GroupRoute, SignInRoute} from "./router/AllRoutes";
import {Navigation} from "react-native-navigation";
import {loadTokensFromStorage} from "./api/API.native";

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
  });

  Navigation.setRoot({
    root: {
      stack: {
        children: isAuthenticated
          ? [(AccountTestRoute as any).getLayout({})]
          : [(SignInRoute as any).getLayout({})],
        // children: [(GroupRoute as any).getLayout({slug: "nohello"})],
      },
    },
  });
}
