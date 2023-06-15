export enum ModelName {
  CHANNEL = "channel",
  NOTIFICATION = "notification",
  MESSAGE = "message",
  USER_PGP_KEY = "user_pgp_key",
}

export type ModelRecord = Record<ModelName, string>;
