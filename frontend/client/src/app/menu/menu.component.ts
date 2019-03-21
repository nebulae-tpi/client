import { KeycloakService } from 'keycloak-angular';
import { Component, OnInit } from '@angular/core';
import { ObservableMedia, MediaChange } from '@angular/flex-layout';
import { Subscription } from 'rxjs';
import { KeycloakProfile } from 'keycloak-js';
import { ServiceService } from '../service/service.service';
import { GatewayService } from '../api/gateway.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  opened = true;
  over = 'side';
  expandHeight = '42px';
  collapseHeight = '42px';
  displayMode = 'flat';
  // overlap = false;

  userDetails: KeycloakProfile;

  watcher: Subscription;

  constructor(
    media: ObservableMedia,
    private keycloakService: KeycloakService,
    private serviceService: ServiceService,
    private gateway: GatewayService
  ) {
    this.watcher = media.subscribe((change: MediaChange) => {
      if (change.mqAlias === 'sm' || change.mqAlias === 'xs') {
        this.opened = false;
        this.over = 'over';
      } else {
        this.opened = true;
        this.over = 'side';
      }
    });
  }

  async ngOnInit() {
    if (this.gateway.checkIfUserLogger()) {
      this.userDetails = await this.keycloakService.loadUserProfile();
      this.serviceService.userProfile = this.userDetails;
    }
  }

  async login() {
    await this.keycloakService.login({ scope: 'offline_access' });
  }

  async logout() {
    await this.keycloakService.logout();
  }
}
