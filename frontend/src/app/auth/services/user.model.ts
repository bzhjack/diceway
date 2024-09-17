export interface UserModel {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface UserStorageModel {
  profile: any;
  token: string;
}
