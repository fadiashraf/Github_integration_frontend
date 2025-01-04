  import { Injectable } from '@angular/core';
  import { GithubDataService } from './github-data.service';
  import { Observable } from 'rxjs';

  @Injectable({
    providedIn: 'root'
  })
  export class AgGridBackendService {
    constructor(private endpoint: Observable<any>) { }


    getServerSideDataSource (
      selectedCollection: string,
      generalSearch: string,
    ) {
      return {
        getRows: (params: any) => {
          const requestParams = {
            collection: selectedCollection,
            startRow: params.request.startRow!,
            endRow: params.request.endRow!,
            sortModel: params.request.sortModel,
            filterModel: params.request.filterModel,
            search: generalSearch,
          };

          this.endpoint(requestParams).subscribe({
            next: ({ rows, lastRowIndex }) => {
              params.success({
                rowData: rows,
                rowCount: lastRowIndex,
              });
            },
            error: () => {
              params.fail();
            }
          });
        }
      };
    }
  }
