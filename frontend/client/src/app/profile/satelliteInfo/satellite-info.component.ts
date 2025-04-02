import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  map,
  mergeMap,
  takeUntil,
  tap,
  filter,
  debounceTime,
  distinctUntilChanged
} from 'rxjs/operators';
import { of, Subject, Observable, combineLatest, fromEvent, forkJoin, from } from 'rxjs';
import { FormControl } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { MenuService } from 'src/app/menu/menu.service';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-satellite-info',
  templateUrl: './satellite-info.component.html',
  styleUrls: ['./satellite-info.component.css']
})
export class SatelliteInfoComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  satelliteCtrl = new FormControl({ value: '', disabled: true });
  satellitesFiltered$: Observable<any>;
  businessList = [];
  selectedBusinessId: any;

  selectedSatellite: any;
  userProfile: any;
  linkedSatellite: any;
  triedToLinkSatellite = false;

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private menuService: MenuService,
    private keycloakService: KeycloakService
  ) { }

  async ngOnInit() {
    this.loadAutocomplete();
    this.loadUserProfile();
    this.loadSatellite();
    this.loadBusinessList();
    console.log('Token: ', await this.keycloakService.getToken());
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
  }

  loadBusinessList() {
    this.profileService.getbusinessList$()
      .pipe(
        map((result: any) => ((result || {}).data || {}).getBusinesses),
        filter((response: any) => !response.errors),
        tap((response: any) => {
          this.businessList = response.map(r => ({name: r.generalInfo.name, id: r._id}));
          console.log("businessList ==> ", this.businessList);
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  loadSatellite() {
    this.route.params
      .pipe(
        map(params => params.id),
        tap(satelliteID => console.log({satelliteID})),
        filter(id => (id && id !== 'new' && id !== 'view')),
        tap(() => this.triedToLinkSatellite = true),
        mergeMap(sId => forkJoin(
          this.profileService.linkSatellite$(sId),
          this.menuService.loadSatelliteLinked$(sId)
        )),
        map(([response, satelliteLinkedResponse]) => ({
          result: ((response || {}).data || {}).linkSatellite || response,
          satellite: (satelliteLinkedResponse && satelliteLinkedResponse.data && satelliteLinkedResponse.data.ClientLinkedSatellite)
            ? satelliteLinkedResponse.data.ClientLinkedSatellite
            : null
        })),
        tap(({result, satellite}) => {
          if ( result && result.code === 200) {
          this.menuService.currentUserProfile$.next({ ...this.userProfile, satelliteId: satellite.id  });
          this.menuService.currentLinkedSatellite$.next(satellite);
          this.triedToLinkSatellite = false;
          } else {
            console.log('resultado  ==> ', result.errors );
          }
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(r => {}, e => console.log(e), () => {});
  }

  loadUserProfile() {
    combineLatest(
      this.menuService.currentUserProfile$,
      this.menuService.currentLinkedSatellite$
    )
    .pipe(
      tap(([userProfile, linkedSatellite ]) => {
        this.userProfile = userProfile;
        this.linkedSatellite = linkedSatellite;
      }),
    )
    .subscribe(ev => {}, e => console.log(e), () => { });


  }

  onBusinessChange(selectedId: string) {
    this.selectedBusinessId = selectedId;
    if (this.selectedBusinessId) {
      this.satelliteCtrl.enable();
    } else {
      this.satelliteCtrl.disable();
    }
  }

  removeSelectedSatellite() {
    this.selectedSatellite = null;
  }

  loadAutocomplete() {
    this.satellitesFiltered$ = this.satelliteCtrl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(input => typeof input === 'string'),
      map((filterText: string) => filterText ? filterText.trim().toLowerCase() : ''),
      mergeMap(filterTextValue => this.getSatelliteFiltered$(filterTextValue))
    );

   }

  getSatelliteFiltered$(filterInput): Observable<any[]> {
    return this.profileService.getFilteredSatelliteList$(filterInput, this.selectedBusinessId).pipe(
      filter((resp: any) => !resp.errors),
      map((result: any) => ((result || {}).data || {}).ClientSatellites),
      takeUntil(this.ngUnsubscribe)
    );
  }

  displayFn(client): string | undefined {
    return (client || {}).name || '';
  }

  onSelectSatelliteEvent(satellite) {
    this.selectedSatellite = satellite;
  }

  linkSatellite() {
    return of(this.selectedSatellite)
      .pipe(
        mergeMap(satellite => this.profileService.linkSatellite$(satellite._id)),
        map(respopnse => ((respopnse || {}).data || {}).linkSatellite ),
        tap(result => {
          if (result && result.code === 200) {
          this.menuService.currentUserProfile$.next({...this.userProfile, satelliteId: this.selectedSatellite._id});
          this.menuService.currentLinkedSatellite$.next(this.selectedSatellite);
          this.selectedSatellite = null;
          }
        }),
        mergeMap(() => {
          return from(this.keycloakService.updateToken(2592000));
        }),
        tap(refreshed => {
          if (refreshed) {
            console.log('Token refrescado:', this.keycloakService.getKeycloakInstance().token);
          } else {
            console.log('El token sigue siendo válido');
          }
        })
      )
      .subscribe(result => {}, e => console.log(e), () => { });
  }

  unlinkSatellite() {
    this.profileService.unlinkSatellite$()
    .pipe(
      map(response => ((response || {}).data || {}).unlinkSatellite ),
      tap(result => {
        if (result.code === 200) {
          this.menuService.currentUserProfile$.next({...this.userProfile, satelliteId: null});
          this.menuService.currentLinkedSatellite$.next(null);
        }
      })
    )
    .subscribe();
  }
}
