import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  MatFormFieldModule,
  MatButtonModule,
  MatCheckboxModule,
  MatNativeDateModule,
  MatMenuModule,
  MatIconModule,
  MatSidenavModule,
  MatListModule,
  MatExpansionModule,
  MatGridListModule,
  MatToolbarModule,
  MatInputModule
} from '@angular/material';

@NgModule({
  imports: [
    MatFormFieldModule,
    MatInputModule,
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
    MatGridListModule,
    MatListModule
  ],
  exports: [
    MatFormFieldModule,
    MatInputModule,
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
    MatGridListModule,
    MatListModule
  ]
})
export class CustomMaterialModule {}
