import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomMaterialModule } from '../material.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SatelliteComponent } from './satellite.component';
import { SatelliteService } from './satellite.service';
import { RequestServiceDialogComponent } from './request-service-dialog/request-service-dialog.component';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { CancelClientSheetComponent } from './cancel-sheet/cancel-sheet.component';

const routes: Routes = [
  { path: '', component: SatelliteComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CustomMaterialModule,
    ReactiveFormsModule, // checkout if its neccesary
    // Angular material
    MatSliderModule,
    MatButtonToggleModule,
    MatTableModule,
    FormsModule
  ],
  declarations: [
    SatelliteComponent,
    RequestServiceDialogComponent,
    CancelClientSheetComponent
  ],
  entryComponents: [ RequestServiceDialogComponent, CancelClientSheetComponent ],
  providers: [ SatelliteService ]
})


export class SatelliteModule {}
