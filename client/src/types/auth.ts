export type AuthUser = {
  id: number;
  username: string;
  account: string;
  avatar: string;
  role: number;
  type: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};
