import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AgmCoreModule } from '@agm/core';
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
import { LocationComponent } from './location/location.component';
import { HistoryComponent } from './history/history.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    NotfoundComponent,
    LocationComponent,
    HistoryComponent
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
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyByGMKwZIYXqcPONjNSX-KHJ9kbP5tBu5I'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
