import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MenuComponent } from './menu/menu.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { ServiceComponent } from './service/service.component';
import { HistoryComponent } from './history/history.component';
import { AppAuthGuard } from './auth/appAuthGuard.service';
import { ClientChatComponent } from './chat/client-chat.component';
import { AppMobileComponent } from './app-mobile/app-mobile.component';
import { AppMobilesComponent } from './app-mobiles/app-mobiles.component';

const routes: Routes = [
  {
    path: '', component: MenuComponent, children: [
      { path: 'service', component: ServiceComponent },
      { path: '', component: ServiceComponent},
      { path: 'history', component: HistoryComponent },
      { path: 'app-mobile', component: AppMobileComponent },
      { path: 'appmobiles', component: AppMobilesComponent },
      { path: 'clientchat', component: ClientChatComponent },
      { path: 'profile', loadChildren: './profile/profile.module#ProfileModule', canActivate: [ AppAuthGuard ] },
      { path: 'satellite', loadChildren: './satellite/satellite.module#SatelliteModule', canActivate: [AppAuthGuard] },
    // { path: '', loadChildren: './transaction/transaction.module#TransactionModule' },
    // { path: 'a', loadChildren: './account/account.module#AccountModule' },
       // canActivate: [
    //   AppAuthGuard
    // ],
  ]},
  // { path: 'auth', loadChildren: './auth/auth.module#AuthModule' },
  // { path: 'p', loadChildren: './pages/pages.module#PagesModule' },
  { path: '**', component: NotfoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AppAuthGuard]
})
export class AppRoutingModule {}
