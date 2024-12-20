import { Directive, EventEmitter, HostListener, Input, Output, OnDestroy } from '@angular/core';
import {
  GridApi,
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from 'ag-grid-community';
import { EMPTY, Subject } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { RemoteGridApi } from './../models/grid-api';

type ServerSideGridApi = GridApi & {
  setServerSideDatasource(dataSource: IServerSideDatasource): void;
};

@Directive({
  selector: '[remoteGridBinding]'
})
export class RemoteGridBindingDirective implements OnDestroy {
  @Input()
  remoteGridBinding!: RemoteGridApi;

  @Output()
  remoteGridReady = new EventEmitter<ServerSideGridApi>();

  private destroy$ = new Subject<void>();
  private gridApi?: ServerSideGridApi;

  constructor() {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('gridReady', ['$event'])
  onGridReady(params: { api: GridApi }): void {
    this.gridApi = params.api as ServerSideGridApi;
    this.gridApi.setServerSideDatasource(this.dataSource);
    this.remoteGridReady.emit(this.gridApi);
  }

  private handleError(error: any): void {
    console.error('Remote grid binding error:', error);
    // You might want to add proper error handling here
    // such as showing a notification or emitting an error event
  }

  private readonly dataSource: IServerSideDatasource = {
    getRows: (params: IServerSideGetRowsParams) => {
      this.remoteGridBinding.getData(params)
        .pipe(
          tap(({ data, totalRecords }) => {
            params.success({
              rowData: data,
              rowCount: totalRecords
            });
          }),
          catchError((error) => {
            this.handleError(error);
            params.fail();
            return EMPTY;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe();
    }
  };
}
