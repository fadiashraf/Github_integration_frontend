import { Collection } from '../../models/githubData.model';
import { GithubDataService } from './../../services/github-data.service';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AgGridAngular } from "ag-grid-angular";
import type { ColDef, GridApi, GridOptions, GridReadyEvent, IServerSideDatasource, IServerSideGetRowsParams, RowModelType, SizeColumnsToContentStrategy, ValueFormatterParams } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry, ValidationModule } from "ag-grid-community";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatSelectChange } from '@angular/material/select';
import { ServerSideRowModelModule, } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ValidationModule, ServerSideRowModelModule]);

@Component({
  standalone: true,
  imports: [
    CommonModule,
    AgGridAngular,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatInputModule,
    FormsModule
  ],
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  selectedIntegration: string = 'Github';
  selectedCollection: string = '';
  integrations = ["Github"];
  collections: Collection[] = [];
  rowData: any[] = [];
  colDefs: ColDef[] = [];
  pageSize = 100;
  currentPage = 1;
  totalRows = 0;
  generalSearch = '';



  defaultColDef = {
    flex: 1,
    sortable: true,
    filter: true,
    resizable: true,
    cellDataType: false
    // floatingFilter: true
  };

  gridOptions: GridOptions = {
    rowModelType: 'serverSide',
    pagination: true,
    paginationPageSize: this.pageSize,
    cacheBlockSize: this.pageSize,
    serverSideSortAllLevels: true,
    groupDisplayType: 'singleColumn'
  };

  autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents',
  };

  private gridApi!: GridApi<any>;

  constructor(private githubDataService: GithubDataService) { }

  ngOnInit (): void {
    this.loadCollections();
  }

  onGridReady (params: GridReadyEvent<any>) {
    this.gridApi = params.api;

    if (this.selectedCollection) {
      this.loadCollectionData();
    }
  }

  private getServerSideDataSource (): IServerSideDatasource {
    return {
      getRows: (params: IServerSideGetRowsParams) => {
        const requestParams = {
          collection: this.selectedCollection,
          startRow: params.request.startRow!,
          endRow: params.request.endRow!,
          sortModel: params.request.sortModel,
          filterModel: params.request.filterModel,
          search: this.generalSearch,
        };


        this.githubDataService.getCollectionData(requestParams).subscribe({
          next: ({ rows, lastRowIndex }) => {
            if (this.colDefs.length > 0 && !this.colDefs[0].cellDataType) {
              this.updateColumnTypes(rows);
            }
            this.sizeToFit();

            params.success({
              rowData: rows,
              rowCount: lastRowIndex,
            });
          },
          error: (err) => {
            params.fail();
            console.error('Error fetching collection data:', err);
          }
        });
      }
    };
  }

  private loadCollections (): void {
    this.githubDataService.getCollections().subscribe({
      next: ({ collections }) => {
        this.collections = collections;
        if (collections.length > 0) {
          this.selectedCollection = collections[0].collectionName;
          this.updateColumnDefs(collections[0].fields);
          this.loadCollectionData();
        }
      },
      error: (err) => {
        console.error('Error fetching collections:', err);
      }
    });
  }

  private loadCollectionData () {
    if (this.gridApi) {
      const dataSource = this.getServerSideDataSource();
      this.gridApi.setGridOption('serverSideDatasource', dataSource);
    }
  }

  private updateColumnDefs (fields: string[]): void {
    this.colDefs = fields.map(field => ({
      field: field,
      headerName: this.formatHeaderName(field),
      sortable: true,
      filter: true,
      resizable: true,
    }));
  }

  private updateColumnTypes (rows: any[]): void {
    this.colDefs = this.colDefs.map((colDef: ColDef) => {
      const field = colDef.field!;
      const type = this.inferColumnType(field, rows);
      return {
        ...colDef,
        filter: type === 'date' ? 'agDateColumnFilter' : 'agTextColumnFilter',
        valueFormatter: type === 'date' ? this.dateFormatter : undefined,
        cellDataType: type,
      };
    });

    this.gridApi.setGridOption('columnDefs', this.colDefs)

  }

  private dateFormatter = (params: ValueFormatterParams) => {
    if (!params.value) return '';
    const date = new Date(params.value);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  private formatHeaderName (field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private inferColumnType (field: string, rows: any[]): string {
    const samples = rows
      .map(row => row[field])
      .filter(value => value != null)
      .slice(0, 5);

    if (samples.length === 0) return 'text';

    if (samples.every(value => this.isDateValue(value))) {
      return 'date';
    }


    return 'text';
  }

  private isDateValue (value: any): boolean {
    if (!value) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime()) &&
      typeof value === 'string' &&
      (value.includes('-') || value.includes('/'));
  }

  sizeToFit () {
    if (this.gridApi) {
      this.gridApi.autoSizeAllColumns();

    }
  }


  handleCollectionChange (event: MatSelectChange): void {
    this.selectedCollection = event.value;
    this.generalSearch = ''
    const selectedCollectionData = this.collections.find(
      c => c.collectionName === event.value
    );

    if (selectedCollectionData) {
      this.updateColumnDefs(selectedCollectionData.fields);
      this.currentPage = 1;
      this.loadCollectionData();

    }
  }

  onFilterTextBoxChanged () {
    this.generalSearch = (document.getElementById("filter-text-box") as HTMLInputElement).value ?? '';
    this.loadCollectionData();
  }

}
