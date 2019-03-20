/**
 * The access token which is a short-lived JSON Web Token (JWT) an account may
 * use to access our API.
 */
export type AccessToken = string & {readonly _type: typeof AccessToken};
declare const AccessToken: unique symbol;

/**
 * The refresh token which an account may use to generate a new access token.
 */
export type RefreshToken = string & {readonly _type: typeof RefreshToken};
declare const RefreshToken: unique symbol;
