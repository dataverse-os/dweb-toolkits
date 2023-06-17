export enum ModelType {
  CHANNEL = "channel",
  NOTIFICATION = "notification",
  MESSAGE = "message",
  USER_PGP_KEY = "user_pgp_key",
}

export type ModelIds = Record<ModelType, string>;
