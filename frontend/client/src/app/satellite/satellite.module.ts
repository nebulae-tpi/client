import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomMaterialModule } from '../material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { SatelliteComponent } from './satellite.component';
import { SatelliteService } from './satellite.service';
import { RequestServiceDialogComponent } from './request-service-dialog/request-service-dialog.component';

const routes: Routes = [
  { path: '', component: SatelliteComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CustomMaterialModule,
    ReactiveFormsModule // checkout if its neccesary
  ],
  declarations: [
    SatelliteComponent,
  ],
  entryComponents: [ RequestServiceDialogComponent ],
  providers: [ SatelliteService ]
})


export class SatelliteModule {}
