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
/**
 * The Device Token is a push notification token associated to a device.
 *  We will use this token to confirm that we are authorized to push a
 *  notification.
 */
export type DeviceToken = string & {readonly _type: typeof DeviceToken};
declare const DeviceToken: unique symbol;
