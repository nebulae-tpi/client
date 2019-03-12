import { KeycloakService, KeycloakAngularModule } from 'keycloak-angular';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

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
import { keycloakInitializer } from './auth/keycloakInitializer';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    NotfoundComponent
  ],
  imports: [
    BrowserModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    BrowserAnimationsModule,
    CustomMaterialModule,
    LayoutModule,
    AppRoutingModule,
    NgProgressModule.forRoot(),
    NgProgressRouterModule,
    FormsModule,
    ReactiveFormsModule,
    KeycloakAngularModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: keycloakInitializer,
      multi: true,
      deps: [KeycloakService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
