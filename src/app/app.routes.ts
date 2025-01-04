import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { PreventAuthenticatedAccessGuard } from './guards/prevent-authenticated-access.guard';
import { GithubIntegrationComponent } from './components/github-integration/github-integration.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CallbackComponent } from './components/callback/callback.component';
import { RepoDetailsComponent } from './components/repo-details/repo-details.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'repos', component: RepoDetailsComponent, canActivate: [AuthGuard] },
  { path: 'auth', component: GithubIntegrationComponent, canActivate: [PreventAuthenticatedAccessGuard] },
  { path: 'auth/github/callback', component: CallbackComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
