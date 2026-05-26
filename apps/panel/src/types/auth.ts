export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type PanelAuthUser = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
};

export type PanelAuthResponse = AuthTokens & {
  user?: PanelAuthUser;
};

export type AccessClaims = {
  isBrandOwner: boolean;
  isSuperAdmin: boolean;
};
