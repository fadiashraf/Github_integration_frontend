import { Collection } from '../../models/githubData.model';
import { GithubDataService } from './../../services/github-data.service';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AgGridAngular } from "ag-grid-angular";
import type { ColDef, GridApi, GridOptions, GridReadyEvent, IServerSideDatasource, RowModelType, SizeColumnsToContentStrategy } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatSelectChange } from '@angular/material/select';

ModuleRegistry.registerModules([AllCommunityModule]);

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
  pageSize = 10000;
  currentPage = 1;
  totalRows = 0;

  defaultColDef = {
    flex: 1,
    sortable: true,
    filter: true,
    resizable: true,
  }




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
    this.gridApi.sizeColumnsToFit();

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
      },
    });
  }

  private loadCollectionData (): void {
    const params = {
      collection: this.selectedCollection,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    this.githubDataService.getCollectionData(params).subscribe({
      next: ({ data, page, totalCount }) => {
        this.rowData = data;
        this.totalRows = totalCount;

        this.sizeToFit();
      },
      error: (err) => {
        console.error('Error fetching collection data:', err);
      }
    });
  }

  private updateColumnDefs (fields: string[]): void {
    this.colDefs = fields.map(field => ({
      field: field,
      headerName: this.formatHeaderName(field),
      sortable: true,
      filter: true,
      resizable: true
    }));
  }

  private formatHeaderName (field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  sizeToFit () {
    if (this.gridApi) {
      this.gridApi.autoSizeAllColumns(); // Automatically size columns to fit their content
      this.gridApi.refreshCells(); // Refresh the grid to ensure the changes are visible
    }
  }

  handleCollectionChange (event: MatSelectChange): void {
    this.selectedCollection = event.value;
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
    this.gridApi.setGridOption(
      "quickFilterText",
      (document.getElementById("filter-text-box") as HTMLInputElement).value,
    );
  }



}

