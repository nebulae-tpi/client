import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  MatButtonModule,
  MatCheckboxModule,
  MatNativeDateModule,
  MatMenuModule,
  MatIconModule,
  MatSidenavModule,
  MatListModule,
  MatExpansionModule,
  MatToolbarModule
} from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatButtonModule,
    MatMenuModule,
    MatToolbarModule,
    MatNativeDateModule,
    MatIconModule,
    FlexLayoutModule,
    MatSidenavModule,
    MatExpansionModule,
    MatListModule
  ],
  exports: [
    CommonModule,
    MatCheckboxModule,
    MatButtonModule,
    MatMenuModule,
    FlexLayoutModule,
    MatToolbarModule,
    MatNativeDateModule,
    MatIconModule,
    MatSidenavModule,
    MatExpansionModule,
    MatListModule
  ]
})
export class CustomMaterialModule {}
