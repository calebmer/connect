import * as Schema from "./Schema";

export const signUp = Schema.createMutation({
  path: "/account/sign-up",
  input: {
    name: Schema.string,
    email: Schema.string,
    password: Schema.string,
  },
  output: {},
});

export const signIn = Schema.createMutation({
  path: "/account/sign-in",
  input: {
    email: Schema.string,
    password: Schema.string,
  },
  output: {},
});

export const signOut = Schema.createMutation({
  path: "/account/sign-out",
  input: {},
  output: {},
});
