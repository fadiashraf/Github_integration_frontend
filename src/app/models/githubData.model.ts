export interface Collection {
  title: string;
  collectionName: string;
  fields: string[];
}
export interface RepoDetails {
  _id: string,
  commitCount: number,
  pullRequestCount: number,
  issueCount: number,
  createdAt: Date,
  defaultBranch: string,
  description: string,
  forks: number,
  language: string,
  name: string,
  stars: number,
  updatedAt: Date,
  url: string,
}

export interface CollectionsResponse {
  collections: Collection[];
}


export interface CollectionDataResponse {
  lastRowIndex: number;
  rows: Array<any>;
}
export interface RepoDetailsResponse {
  lastRowIndex: number;
  rows: Array<RepoDetails>;
}
