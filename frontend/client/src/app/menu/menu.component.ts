import { KeycloakService } from 'keycloak-angular';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ObservableMedia, MediaChange } from '@angular/flex-layout';
import { Subscription, Subject } from 'rxjs';
import { KeycloakProfile } from 'keycloak-js';
import { ServiceService } from '../service/service.service';
import { GatewayService } from '../api/gateway.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit, OnDestroy {
  opened = true;
  over = 'side';
  expandHeight = '42px';
  collapseHeight = '42px';
  displayMode = 'flat';
  // overlap = false;

  userDetails: KeycloakProfile;

  watcher: Subscription;
  private ngUnsubscribe = new Subject();

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
    this.listenNavigationBack();
  }

  listenNavigationBack(){
    this.serviceService.backNavigation$
    .pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(back => {
      this.closeMenu();
    });
  }

  closeMenu() {
    if (this.over === 'over') {
      this.opened = false;
    }
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
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_refreshToken');
    this.keycloakService.clearToken();
    await this.keycloakService.logout();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
