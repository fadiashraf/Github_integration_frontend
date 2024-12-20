import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GithubAuthService } from './../../services/github-auth.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss']
})
export class CallbackComponent implements OnInit {
  code = '';
  state = '';

  constructor(
    private githubAuthService: GithubAuthService,
    private route: ActivatedRoute
  ) { }

  ngOnInit (): void {
    console.log('Callback component initialized');
    this.route.queryParams.subscribe(params => {
      this.code = params['code'] || '';
      this.state = params['state'] || '';
      this.githubAuthService.handleCallback(this.code, this.state)


    });
  }
}
