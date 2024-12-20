import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CollectionDataResponse, CollectionsResponse } from '../models/githubData.model';

@Injectable({
  providedIn: 'root'
})
export class GithubDataService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getCollectionData (params: {
    collection: string;
    page: number;
    pageSize: number
  }): Observable<CollectionDataResponse> {
    return this.http.get<CollectionDataResponse>(`${this.API_URL}/github/collections/${params.collection}`, { params: { pageSize: params.pageSize, page: params.page } });
  }

  syncData (): Observable<any> {
    return this.http.post(`${this.API_URL}/github/sync`, {});
  }

  getCollections (): Observable<CollectionsResponse> {
    return this.http.get<CollectionsResponse>(`${this.API_URL}/github/collections`);
  }
}
