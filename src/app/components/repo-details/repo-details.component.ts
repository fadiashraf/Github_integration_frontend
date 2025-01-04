import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgGridAngular } from "ag-grid-angular";
import {
  AllCommunityModule, ModuleRegistry, ValidationModule,
  ColDef, GridApi, GridOptions, GridReadyEvent,
  IRowNode, IServerSideDatasource, IServerSideGetRowsParams,
  ValueFormatterParams, ICellRendererParams
} from "ag-grid-community";
import {
  MasterDetailModule, ServerSideRowModelApiModule,
  ServerSideRowModelModule
} from 'ag-grid-enterprise';
import { Subject, takeUntil, finalize, timer, retry } from 'rxjs';
import { GithubDataService } from './../../services/github-data.service';
import { Collection } from '../../models/githubData.model';
import { LinkRendererComponent } from '../link-renderer/link-renderer.component';

interface DetailConfig {
  endpoint: string;
  columns: ColDef[];
}

interface RequestParams {
  collection?: string;
  repoId?: string;
  startRow: number;
  endRow: number;
  sortModel: any;
  filterModel: any;
  type?: string;
  search: string;
}

@Component({
  selector: 'app-repo-details',
  standalone: true,
  imports: [
    CommonModule,
    AgGridAngular,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './repo-details.component.html',
  styleUrl: './repo-details.component.scss'
})
export class RepoDetailsComponent implements OnInit, OnDestroy {
  readonly PAGE_SIZE = 100;
  readonly INTEGRATIONS = ["Github"];
  readonly DETAIL_TYPES = ['Commit', 'pullRequest', 'Issue'] as const;
  readonly MAX_RETRIES = 3;
  readonly RETRY_DELAY = 1000;

  selectedIntegration = 'Github';
  selectedCollection = '';
  collections: Collection[] = [];
  generalSearch = '';
  colDefs: ColDef[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';

  private gridApi!: GridApi<any>;
  private detailsFields: Record<string, string[]> = {};
  private destroy$ = new Subject<void>();
  private dataLoadAttempts = 0;

  private readonly detailConfigs: Record<string, DetailConfig> = {
    Commit: {
      endpoint: 'Commit',
      columns: []
    },
    pullRequest: {
      endpoint: 'pullRequest',
      columns: []
    },
    Issue: {
      endpoint: 'Issue',
      columns: []
    }
  };

  readonly defaultColDef: ColDef = {
    flex: 1,
    sortable: true,
    filter: true,
    resizable: true,
    suppressSizeToFit: false
  };

  readonly gridOptions: GridOptions = {
    rowModelType: 'serverSide',
    pagination: true,
    paginationPageSize: this.PAGE_SIZE,
    cacheBlockSize: this.PAGE_SIZE,
    serverSideSortAllLevels: true,
    groupDisplayType: 'singleColumn',
    masterDetail: true,
    detailRowHeight: 400,
    detailCellRenderer: 'agDetailCellRenderer',
    detailCellRendererParams: this.createDetailRendererParams.bind(this),
    onGridSizeChanged: () => this.sizeToFit(),
    onViewportChanged: () => this.sizeToFit(),
    onFirstDataRendered: (params) => {
      this.sizeToFit();
      // Optionally auto-expand first row
      // params.api.getDisplayedRowAtIndex(0)?.setExpanded(true);
    },
    loading: false,
    suppressNoRowsOverlay: true
  };

  constructor(private githubDataService: GithubDataService) {
    ModuleRegistry.registerModules([
      AllCommunityModule,
      ValidationModule,
      ServerSideRowModelModule,
      ServerSideRowModelApiModule,
      MasterDetailModule
    ]);
  }

  ngOnInit (): void {
    this.loadCollections();
  }

  ngOnDestroy (): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onGridReady (params: GridReadyEvent<any>): void {
    this.gridApi = params.api;
    if (this.selectedCollection) {
      this.loadRepoData();
    }
  }

  onFilterTextBoxChanged (event: Event): void {
    this.generalSearch = (event.target as HTMLInputElement).value;
    this.loadRepoData();
  }

  private loadCollections (): void {
    this.isLoading = true;
    this.hasError = false;

    this.githubDataService.getCollections()
      .pipe(
        takeUntil(this.destroy$),
        retry({
          count: this.MAX_RETRIES,
          delay: (error, retryCount) => timer(this.RETRY_DELAY * retryCount)
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: ({ collections }) => {
          if (!collections || !Array.isArray(collections)) {
            this.handleError('Invalid collections data received');
            return;
          }

          this.collections = collections;
          this.initializeCollections(collections);
        },
        error: (err) => this.handleError('Error fetching collections', err)
      });
  }

  private initializeCollections (collections: Collection[]): void {
    collections.forEach(collection => {
      if (this.DETAIL_TYPES.includes(collection.collectionName as any)) {
        this.detailsFields[collection.collectionName] = collection.fields;
        this.detailConfigs[collection.collectionName].columns =
          this.createDetailColumns(collection.collectionName);
      }
    });

    const mainCollection = collections.find(c =>
      !this.DETAIL_TYPES.includes(c.collectionName as any));
    if (mainCollection) {
      this.selectedCollection = mainCollection.collectionName;
      this.updateColumns(mainCollection.fields);
      if (this.gridApi) {
        this.loadRepoData();
      }
    }
  }

  private createDetailRendererParams (params: ICellRendererParams) {
    const type = params.data.detailType;
    const config = this.detailConfigs[type];

    if (!config) {
      console.error(`No config found for detail type: ${type}`);
      return null;
    }

    return {
      detailGridOptions: {
        rowModelType: 'serverSide',
        pagination: true,
        paginationPageSize: this.PAGE_SIZE,
        cacheBlockSize: this.PAGE_SIZE,
        columnDefs: config.columns,
        defaultColDef: this.defaultColDef,
        suppressLoadingOverlay: true,
        suppressNoRowsOverlay: true,
        serverSideDatasource: this.getServerSideDataSourceForDetails(params.data._id, type),
        onGridReady: (params: GridReadyEvent) => {
          params.api.sizeColumnsToFit();
        }
      }
    };
  }

  private getServerSideDataSourceForDetails (repoId: string, type: string): IServerSideDatasource {
    return {
      getRows: (params: IServerSideGetRowsParams) => {
        const requestParams = this.createRequestParams(params, repoId, type);
        this.fetchDetailData(params, requestParams);
      }
    };
  }

  private fetchDetailData (params: IServerSideGetRowsParams, requestParams: RequestParams): void {
    this.githubDataService.getDetailsOfRepo(requestParams as any)
      .pipe(
        takeUntil(this.destroy$),
        retry({
          count: this.MAX_RETRIES,
          delay: (error, retryCount) => timer(this.RETRY_DELAY * retryCount)
        })
      )
      .subscribe({
        next: ({ rows, lastRowIndex }) => {
          if (!this.validateResponseData(rows, lastRowIndex)) {
            params.fail();
            return;
          }
          params.success({ rowData: rows, rowCount: lastRowIndex });
        },
        error: (err) => {
          params.fail();
          console.error('Error fetching details:', err);
        }
      });
  }


  private updateColumns (fields: string[]): void {
    const baseColumns: ColDef[] = [
      { field: '_id', headerName: 'ID', minWidth: 100 },
      this.createCountColumn('commitCount', 'Commit Count', 'Commit'),
      this.createCountColumn('pullRequestCount', 'Pull Request Count', 'pullRequest'),
      this.createCountColumn('issueCount', 'Issue Count', 'Issue')
    ];

    const dynamicColumns: ColDef[] = fields
      .filter(field => !baseColumns.some(col => col.field === field))
      .map(field => ({
        field,
        headerName: this.formatHeaderName(field),
        minWidth: 120,
        ...this.getColumnConfig(field)
      }));

    this.colDefs = [...baseColumns, ...dynamicColumns];
    if (this.gridApi) {
      this.gridApi.setGridOption('columnDefs', this.colDefs);
    }
  }

  private createDetailColumns (type: string): ColDef[] {
    const fields = this.detailsFields[type] || [];
    return fields.map(field => ({
      field,
      headerName: this.formatHeaderName(field),
      minWidth: 120,
      ...this.getColumnConfig(field)
    }));
  }

  private createCountColumn (field: string, header: string, type: string): ColDef {
    return {
      field,
      headerName: header,
      filter: 'agNumberColumnFilter',
      minWidth: 150,
      cellRenderer: LinkRendererComponent,
      cellRendererParams: (params: ICellRendererParams) => ({
        displayText: params.value,
        type,
        onClick: () => this.showDetail(params.node, type)
      })
    };
  }

  private showDetail (node: IRowNode, type: string): void {
    if (!node || !type) return;
    node.data.detailType = type;
    node.setExpanded(!node.expanded);
  }

  // Utility methods
  private formatHeaderName (field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private getColumnConfig (field: string): Partial<ColDef> {
    const dateFields = ['createdAt', 'updatedAt', 'date'];
    const numberFields = ['forks', 'stars', 'number'];

    if (dateFields.includes(field)) {
      return {
        filter: 'agDateColumnFilter',
        valueFormatter: this.createDateFormatter
      };
    }

    if (numberFields.includes(field)) {
      return { filter: 'agNumberColumnFilter' };
    }

    return {};
  }

  private createDateFormatter = (params: ValueFormatterParams): string => {
    if (!params.value) return '';
    try {
      return new Date(params.value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return params.value;
    }
  };


  private loadRepoData (): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('serverSideDatasource', this.getServerSideDataSource());
    }
  }

  private getServerSideDataSource (): IServerSideDatasource {
    return {
      getRows: (params: IServerSideGetRowsParams) => {
        const requestParams = this.createRequestParams(params);
        this.fetchRepoData(params, requestParams);
      }
    };
  }

  private createRequestParams (
    params: IServerSideGetRowsParams,
    repoId?: string,
    type?: string
  ): RequestParams {
    return {
      collection: this.selectedCollection,
      repoId,
      startRow: params.request.startRow!,
      endRow: params.request.endRow!,
      sortModel: params.request.sortModel,
      filterModel: params.request.filterModel,
      type,
      search: this.generalSearch
    };
  }

  private validateResponseData (rows: any[], lastRowIndex: number): boolean {
    if (!Array.isArray(rows)) {
      console.error('Invalid rows data format');
      return false;
    }

    if (typeof lastRowIndex !== 'number' || lastRowIndex < 0) {
      console.error('Invalid lastRowIndex');
      return false;
    }

    return true;
  }

  private fetchRepoData (params: IServerSideGetRowsParams, requestParams: RequestParams): void {
    if (!this.gridApi) {
      console.warn('Grid API not ready');
      params.fail();
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    this.githubDataService.getRepos(requestParams)
      .pipe(
        takeUntil(this.destroy$),
        retry({
          count: this.MAX_RETRIES,
          delay: (error, retryCount) => timer(this.RETRY_DELAY * retryCount)
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: ({ rows, lastRowIndex }) => {
          if (!this.validateResponseData(rows, lastRowIndex)) {
            params.fail();
            this.handleError('Invalid data format received');
            return;
          }

          this.dataLoadAttempts = 0;
          this.sizeToFit();
          params.success({ rowData: rows, rowCount: lastRowIndex });
        },
        error: (err) => {
          params.fail();
          this.handleError('Error fetching repo data', err);
        }
      });
  }

  private sizeToFit (): void {
    if (!this.gridApi) return;

    setTimeout(() => {
      this.gridApi.sizeColumnsToFit({
        defaultMinWidth: 100,
        columnLimits: [
          { key: '_id', minWidth: 100 },
          { key: 'commitCount', minWidth: 150 },
          { key: 'pullRequestCount', minWidth: 150 },
          { key: 'issueCount', minWidth: 150 }
        ]
      });
    }, 0);
  }

  private handleError (message: string, error?: any): void {
    this.hasError = true;
    this.errorMessage = message;
    console.error(message, error);
  }


  clearSearch (): void {
    this.generalSearch = '';
    this.loadRepoData();
  }

  onCollectionChange (): void {
    const selectedColl = this.collections.find(c => c.collectionName === this.selectedCollection);
    if (selectedColl) {
      this.updateColumns(selectedColl.fields);
      this.loadRepoData();
    }
  }


  isDetailExpanded (node: IRowNode): boolean {
    return !!node && node.expanded;
  }

  getDetailType (node: IRowNode): string | undefined {
    return node?.data?.detailType;
  }
}
