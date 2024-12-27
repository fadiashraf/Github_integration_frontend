import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CollectionDataResponse, CollectionsResponse } from '../models/githubData.model';
import { AdvancedFilterModel, FilterModel, SortModelItem } from 'ag-grid-community';

@Injectable({
  providedIn: 'root'
})
export class GithubDataService {
  private readonly API_URL = environment.apiUrl;

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

  syncData (): Observable<any> {
    return this.http.post(`${this.API_URL}/github/sync`, {});
  }

  getCollections (): Observable<CollectionsResponse> {
    return this.http.get<CollectionsResponse>(`${this.API_URL}/github/collections`);
  }
}
