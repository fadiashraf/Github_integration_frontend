export interface Collection {
  title: string;
  collectionName: string;
  fields: string[];
}

export interface CollectionsResponse {
  collections: Collection[];
}


export interface CollectionDataResponse {
  lastRowIndex: number;
  rows: Array<any>;
}
