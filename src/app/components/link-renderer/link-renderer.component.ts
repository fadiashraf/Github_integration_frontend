import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

// Extend ICellRendererParams to include custom properties
interface ILinkRendererParams extends ICellRendererParams {
  routePath: string;
  routeParams: any;
  displayText: string;
  onClick: any;
}

@Component({
  selector: 'app-link-renderer',
  templateUrl: './link-renderer.component.html',
  styleUrls: ['./link-renderer.component.scss']
})
export class LinkRendererComponent implements ICellRendererAngularComp {
  params!: ILinkRendererParams | any;  // Use the custom type

  // Initialize params
  agInit (params: ILinkRendererParams): void {
    this.params = params;
  }

  // Refresh method
  refresh (params: ILinkRendererParams): boolean {
    this.params = params;
    return true;
  }

  constructor(private router: Router) { }



  onClick (): void {
    if (this.params.onClick) {
      this.params.onClick();
    }
  }
}
