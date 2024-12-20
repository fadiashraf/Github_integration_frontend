
export interface CallbackResponse {
  email: string;
  name: string;
  username: string;
  userId:string;
  token: string;
  isAuthenticated :boolean;
  integrationDate:Date;
  isSyncLoading:boolean;
  createdAt:Date;
  updatedAt:Date;
  lastSyncAt:Date;
}



export interface GithubAuthUrl {
  url: string;
}
