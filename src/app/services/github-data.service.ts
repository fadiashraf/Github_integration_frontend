import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CollectionDataResponse, CollectionsResponse, RepoDetailsResponse } from '../models/githubData.model';
import { AdvancedFilterModel, FilterModel, SortModelItem } from 'ag-grid-community';

@Injectable({
  providedIn: 'root'
})
export class GithubDataService {
  private readonly API_URL = environment.apiUrl;
  private collectionData = new BehaviorSubject<CollectionsResponse>({ collections: [] });
  constructor(private http: HttpClient) { }

  getCollectionData (params: {
    collection: string;
    startRow: number;
    endRow: number;
    sortModel: SortModelItem[];
    filterModel: FilterModel | AdvancedFilterModel | null;
    search: string
  }): Observable<CollectionDataResponse> {
    return this.http.get<CollectionDataResponse>(`${this.API_URL}/github/collections/${params.collection}`,
      {
        params: {
          startRow: params.startRow,
          endRow: params.endRow,
          sortModel: JSON.stringify(params.sortModel),
          search: params.search ?? '',
          filterModel: JSON.stringify(params.filterModel)
        }
      });
  }


  getRepos (params: {
    startRow: number;
    endRow: number;
    sortModel: SortModelItem[];
    filterModel: FilterModel | AdvancedFilterModel | null;
    search: string
  }): Observable<RepoDetailsResponse> {
    return this.http.get<RepoDetailsResponse>(`${this.API_URL}/github/repos`,
      {
        params: {
          startRow: params.startRow,
          endRow: params.endRow,
          sortModel: JSON.stringify(params.sortModel),
          search: params.search ?? '',
          filterModel: JSON.stringify(params.filterModel)
        }
      });
  }
  getDetailsOfRepo (params: {
    type: string,
    repoId: string,
    startRow: number;
    endRow: number;
    sortModel: SortModelItem[];
    filterModel: FilterModel | AdvancedFilterModel | null;
    search: string
  }): Observable<RepoDetailsResponse> {
    console.log("type in service",params.type)
    return this.getCollectionData({ ...params, collection: params.type, filterModel: { ...params.filterModel, repoId: { filterType: 'text', type: 'equals', filter: params.repoId } } })
  }

  syncData (): Observable<any> {
    return this.http.post(`${this.API_URL}/github/sync`, {});
  }

  getCollections (): Observable<CollectionsResponse> {

    if (!this.collectionData.value.collections.length) {
      this.http.get<CollectionsResponse>(`${this.API_URL}/github/collections`).subscribe({ next: (data) => this.collectionData.next(data) });
    }
    return this.collectionData.asObservable();
  }

}
