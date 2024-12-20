import { BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { GithubAuthService } from '../../../services/github-auth.service';
import { CallbackResponse } from '../../../models/auth.model';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatExpansionModule, MatButtonModule,MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {


  isConnected = false;
  integrationData: CallbackResponse | null = null;

  constructor(private githubAuthService: GithubAuthService) {
    this.githubAuthService.getIsConnected().subscribe({
      next: (isConnected) => {
        this.isConnected = isConnected || false
      }
    })

    this.githubAuthService.getIntegrationData().subscribe({
      next: (data) => {
        this.integrationData = data;
      }
    })


  }

  ngOnInit (): void {

  }

  async connect (): Promise<any> {
    await this.githubAuthService.redirectToGithubAuth()
  }

  removeIntegration (): void {
    this.githubAuthService.removeIntegration()
  }

}
