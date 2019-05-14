import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { CustomMaterialModule } from '../material.module';
import { SatelliteInfoComponent } from './satelliteInfo/satellite-info.component';
import { MatAutocompleteModule } from '@angular/material';
import { ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [
  { path: '', component: ProfileComponent },
  { path: 'satellite', component: SatelliteInfoComponent},
  { path: 'satellite/:id', component: SatelliteInfoComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CustomMaterialModule,
    MatAutocompleteModule,
    ReactiveFormsModule
  ],
  declarations: [
    ProfileComponent,
    SatelliteInfoComponent
  ],
  entryComponents: [],
  providers: [ ]
})


export class ProfileModule {}
