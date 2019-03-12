import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Tx Plus !!!';
  update = false;
  joke: any;

  constructor(updates: SwUpdate, private router: Router) {
    updates.available.subscribe(ev => {
      updates.activateUpdate().then(() => document.location.reload());
    });
  }
}
