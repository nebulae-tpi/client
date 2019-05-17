import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { CustomMaterialModule } from '../material.module';
import { SatelliteInfoComponent } from './satelliteInfo/satellite-info.component';
import { MatAutocompleteModule } from '@angular/material';
import { ReactiveFormsModule } from '@angular/forms';
import { ClientFavoritesComponent } from './favorites/client-favorites.component';
import { ClientFavoritesDetailComponent } from './favorites/favorite-detail/favorite-detail.component';

const routes: Routes = [
  { path: '', component: ProfileComponent },
  { path: 'satellite', component: SatelliteInfoComponent},
  { path: 'satellite/:id', component: SatelliteInfoComponent },
  { path: 'favorites', component: ClientFavoritesComponent },
  { path: 'favorite/:id', component: ClientFavoritesDetailComponent },
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
    SatelliteInfoComponent,
    ClientFavoritesComponent,
    ClientFavoritesDetailComponent
  ],
  entryComponents: [],
  providers: [ ]
})


export class ProfileModule {}
