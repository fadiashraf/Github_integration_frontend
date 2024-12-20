export interface Collection {
  title: string;
  collectionName: string;
  fields: string[];
}

export interface CollectionsResponse {
  collections: Collection[];
}


export interface CollectionDataResponse {
  totalCount: number;
  data: Array<any>;
  page: number;
  pageSize: number;
  totalPages: number;
}
