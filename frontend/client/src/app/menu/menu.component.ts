import { KeycloakService } from 'keycloak-angular';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ObservableMedia, MediaChange } from '@angular/flex-layout';
import { Subscription, Subject, of } from 'rxjs';
import { KeycloakProfile } from 'keycloak-js';
import { ServiceService } from '../service/service.service';
import { GatewayService } from '../api/gateway.service';
import { takeUntil, mergeMap, map, tap, merge, filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { ContactUsComponent } from '../contact-us/contact-us.component';
import { MenuService } from './menu.service';
import { Router } from '@angular/router';

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

  selectedSatellite: any;
  // userWallet: any;
  userWallet: any;

  constructor(
    media: ObservableMedia,
    private keycloakService: KeycloakService,
    private serviceService: ServiceService,
    private gateway: GatewayService,
    private dialog: MatDialog,
    private menuService: MenuService,
    private router: Router
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

  listenNavigationBack() {
    this.serviceService.backNavigation$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(back => {
        this.closeMenu();
      });
  }

  closeMenu() {
    if (this.over === 'over') {
      this.opened = false;
    }
  }

  openContactUsDialog() {
    this.dialog.closeAll();
    this.dialog.open(ContactUsComponent, {
      width: '350px',
      data: {}
    });
  }

  async ngOnInit() {
    if (this.gateway.checkIfUserLogger()) {
      this.userDetails = await this.keycloakService.loadUserProfile();
      this.serviceService.updateUserProfileUpdate(this.userDetails);

      this.menuService.validateNewClient$()
        .pipe(
          tap(response => {
            const clientId =
              response && response.data && response.data.ValidateNewClient
                ? response.data.ValidateNewClient.clientId
                : undefined;
          }),
          mergeMap(() => this.menuService.loadClientProfile$()),
          map(r => r && r.data && r.data.ClientProfile ? r.data.ClientProfile : null),
          tap((clientProfile: any) => {
            this.menuService.currentUserProfile$.next(clientProfile);
            if (clientProfile && clientProfile.satelliteId) {
              this.router.navigate(['/satellite']);
            }
          }),
          mergeMap(clientProfile =>
            clientProfile && clientProfile.satelliteId
              ? this.menuService.loadSatelliteLinked$(clientProfile.satelliteId)
              : of(null)
          ),
          map(resp => ((resp || {}).data || {}).ClientLinkedSatellite),
          tap(ls => this.menuService.currentLinkedSatellite$.next(ls))
        )
        .subscribe(r => { }, e => console.log(e), () => { });
    } else {
      this.serviceService.updateUserProfileUpdate(null);
    }



    this.listenSatelliteChanges();
  }

  listenSatelliteChanges() {
    this.menuService.currentLinkedSatellite$
      .pipe(
        filter(satellite => satellite != null),
        tap(satellite => this.selectedSatellite = satellite),
        mergeMap((satellite: any) => satellite.tipType === 'VIRTUAL_WALLET'
          ? this.menuService.loadUserWallet$()
          : of({})
        ),
        map((userWallet: any) => ((userWallet || {}).data || {}).ClientWallet),
        tap((userWallet: any) => {
          if (userWallet) {
            this.userWallet = userWallet;
            this.listenWalletUpdates();
          }
        })
      )
      .subscribe();
  }

  listenWalletUpdates() {
    this.menuService.listenWalletUpdates$()
      .pipe(
        map(response => ((response || {}).data || {}).ClientWalletUpdates),
        tap(walletUpdate => this.userWallet = walletUpdate),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
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
