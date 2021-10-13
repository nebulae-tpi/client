import { ServiceService } from './service/service.service';
import { MatSnackBar } from '@angular/material';
import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Router } from '@angular/router';
import { ServiceState } from './service/service-state';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  update = false;
  joke: any;
  lastLocation = null;
  lastBack: Date = null;
 
  constructor(updates: SwUpdate, private router: Router, private snackBar: MatSnackBar, private service: ServiceService) {
    updates.available.subscribe(ev => {
      updates.activateUpdate().then(() => document.location.reload());
    });

    window.history.replaceState({exit: true}, '');
    window.history.pushState({exit: true}, '');

    window.addEventListener('popstate', event => {
      // console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));
      this.service.notifyBackNavigation();

      if (event.state && event.state.exit) {
        if (this.lastBack && this.lastBack.getTime() + 2000 > Date.now()) {
          console.log('Closing app');
        } else {
          setTimeout(() => {
            window.history.pushState({ exit: true }, '');
          }, 2000);
          this.lastBack = new Date();
          this.showSnackMessage('Pulsa atrás de nuevo para salir');
        }
      }
    });
  }

  showSnackMessage(message) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 2000
    });
  }
}
