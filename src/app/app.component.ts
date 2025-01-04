import { GithubAuthService } from './services/github-auth.service';
import { GithubDataService } from './services/github-data.service';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/layout/header/header.component';
import { LoadingComponent } from './components/loading/loading.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor(private githubAuthService: GithubDataService) {

  }
  ngOnInit (): void {
    this.githubAuthService.getCollections().subscribe()
  }
}
