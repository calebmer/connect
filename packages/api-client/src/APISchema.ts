import {Schema} from "./Schema";
import {SchemaInput} from "./SchemaInput";

export const APISchema = Schema.namespace({
  Account: Schema.namespace({
    /**
     * Registers a new account which can be used to access our service.
     * Currently we require an email for password recovery. The account may be
     * accessed again at any time and any device with the email/password
     * combination used at registration.
     */
    signUp: Schema.method({
      email: SchemaInput.string,
      password: SchemaInput.string,
    }),
    signIn: Schema.method({
      email: SchemaInput.string,
      password: SchemaInput.string,
    }),
    signOut: Schema.method({
      refreshToken: SchemaInput.string,
    }),
  }),
});
