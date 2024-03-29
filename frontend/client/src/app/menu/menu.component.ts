import { KeycloakService } from 'keycloak-angular';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ObservableMedia, MediaChange } from '@angular/flex-layout';
import { Subscription, Subject, of, defer } from 'rxjs';
import { KeycloakProfile } from 'keycloak-js';
import { ServiceService } from '../service/service.service';
import { GatewayService } from '../api/gateway.service';
import { takeUntil, mergeMap, map, tap, merge, filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { ContactUsComponent } from '../contact-us/contact-us.component';
import { MenuService } from './menu.service';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { environment } from 'src/environments/environment';

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
  hrefToken = '';
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
    private router: Router,
    private platformLocation: PlatformLocation
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
    console.log("INGRES ON INITI ===> ",window.location.href);
    if(window.location.href.includes("?state") && !window.location.href.includes("app-mobile") &&  !window.location.href.includes("appmobiles"))
    {
      this.hrefToken = window.location.href.replace("?state","appmobiles/?state");
      console.log("INGRES ON IF ===> ");
      setTimeout(()=>{
        console.log("INGRES EJEXUTA TIMEOUT 3333333333333333333");
          const element: HTMLElement = document.getElementById("redirectA") as HTMLElement;
          element.click();  
    }, 200);
      
    }


    if (this.gateway.checkIfUserLogger()) {
      this.userDetails = await this.keycloakService.loadUserProfile();
      this.serviceService.updateUserProfileUpdate(this.userDetails);
      let businessId;
      if (((this.platformLocation as any).location.origin).includes('localhost')) {
        businessId = environment.nebulaBusinessId;
      } else if (((this.platformLocation as any).location.origin).includes('app.txplus')) {
        businessId = environment.caliBusinessId;
      } else if (((this.platformLocation as any).location.origin).includes('manizales.txplus.com.co')) {
        businessId = environment.manizalesBusinessId;
      }
      console.log('BusinessId: ', businessId);
      this.menuService.validateNewClient$(businessId)
        .pipe(
          tap(response => {
            const clientId =
              response && response.data && response.data.ValidateNewClient
                ? response.data.ValidateNewClient.clientId
                : undefined;
          }),
          mergeMap(response => {
            if (response && response.data && response.data.ValidateNewClient && response.data.ValidateNewClient.updated) {
              return defer(() => this.keycloakService.updateToken(-1)).pipe(tap(res => console.log('Resultado token: ', res)));
            } else {
              return of(undefined);
            }
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
