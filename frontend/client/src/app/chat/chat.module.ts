import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomMaterialModule } from '../material.module';
import { MatAutocompleteModule } from '@angular/material';
import { ReactiveFormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';
import { environment } from 'src/environments/environment';
import { ClientChatService } from './client-chat.service';
import { ClientChatComponent } from './client-chat.component';
@NgModule({
  imports: [
    CustomMaterialModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AgmCoreModule.forRoot({
      apiKey: environment.google.maps.key,
      libraries: ['places']
    }),
  ],
  declarations: [
    ClientChatComponent
  ],
  entryComponents: [],
  providers: [
    ClientChatService
  ]
})


export class ChatModule {}
