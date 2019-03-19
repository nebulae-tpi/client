import { KeycloakService, KeycloakAngularModule } from 'keycloak-angular';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { AgmCoreModule, GoogleMapsAPIWrapper } from '@agm/core';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CustomMaterialModule } from '../app/material.module';
import { LayoutModule } from '@angular/cdk/layout';
import { AppRoutingModule } from '../app/app-routing.module';
import { NgProgressModule } from '@ngx-progressbar/core';
import { NgProgressRouterModule } from '@ngx-progressbar/router';
import { MenuComponent } from './menu/menu.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LocationComponent, CancelSheet } from './service/location/location.component';
import { HistoryComponent } from './history/history.component';
import { keycloakInitializer } from './auth/keycloakInitializer';
import { ServiceComponent } from './service/service.component';
import { ContextComponent } from './service/context/context.component';
import { AddressComponent } from './service/address/address.component';
import { RequestButtonComponent } from './service/context/request-button/request-button.component';
import { RequestConfirmationComponent, FilterSheet } from './service/context/request-confirmation/request-confirmation.component';
import { RequestedComponent } from './service/context/requested/requested.component';
import { RequestedProgressComponent } from './service/location/requested-progress/requested-progress.component';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { HttpClientModule } from '@angular/common/http';
import { ApolloModule } from 'apollo-angular';
import { HttpLinkModule } from 'apollo-angular-link-http';
import { GatewayService } from './api/gateway.service';
import { AssignedComponent } from './service/context/assigned/assigned.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    NotfoundComponent,
    LocationComponent,
    HistoryComponent,
    ServiceComponent,
    ContextComponent,
    AddressComponent,
    RequestButtonComponent,
    RequestConfirmationComponent,
    FilterSheet,
    CancelSheet,
    RequestedComponent,
    RequestedProgressComponent,
    AssignedComponent
  ],
  imports: [
    BrowserModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production
    }),
    BrowserAnimationsModule,
    CustomMaterialModule,
    LayoutModule,
    AppRoutingModule,
    NgProgressModule.forRoot(),
    NgProgressRouterModule,
    FormsModule,
    ReactiveFormsModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyByGMKwZIYXqcPONjNSX-KHJ9kbP5tBu5I',
      libraries: ['places']
    }),
    KeycloakAngularModule,
    CurrencyMaskModule,
    ApolloModule,
    HttpLinkModule,
    HttpClientModule
  ],
  providers: [
    GoogleMapsAPIWrapper,
    {
      provide: APP_INITIALIZER,
      useFactory: keycloakInitializer,
      multi: true,
      deps: [KeycloakService]
    },
    GatewayService
  ],
  entryComponents: [FilterSheet, CancelSheet],
  bootstrap: [AppComponent]
})
export class AppModule {}
