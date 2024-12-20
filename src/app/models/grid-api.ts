import { GridApi, IServerSideGetRowsParams } from 'ag-grid-community';
import { Observable } from 'rxjs';

export interface RemoteGridApi {
  getData: (params: IServerSideGetRowsParams) => Observable<{ data: any; totalRecords: number }>;
  getDataError?: (err: any) => void;
  gridApi: GridApi;
}
