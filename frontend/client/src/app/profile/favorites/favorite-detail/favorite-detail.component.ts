import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
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
import {
  of,
  Subject,
  Observable,
  combineLatest,
  fromEvent,
  forkJoin,
  BehaviorSubject
} from 'rxjs';
import { FormControl } from '@angular/forms';
import { ClienFavoriteService } from '../client-favorites.service';
import { MenuService } from 'src/app/menu/menu.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-client-favorite-detail',
  templateUrl: './favorite-detail.component.html',
  styleUrls: ['./favorite-detail.component.scss']
})
export class ClientFavoritesDetailComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  satelliteCtrl = new FormControl(null);
  satellitesFiltered$: Observable<any>;

  selectedSatellite: any;
  userProfile: any;
  linkedSatellite: any;
  triedToLinkSatellite = false;

  selectedFavorite$ = new BehaviorSubject(undefined);

  selectedFavorite: any;

  mapCenter$ = new Subject();
  favoriteName = new FormControl();
  favoriteAddress = new FormControl();
  map: google.maps.Map;
  mapZoom = 16;
  initialLat = 3.416652; // todo
  initialLng = -76.524436; // todo
  favoriteMarker: google.maps.Marker;
  lastCenterReported: any;

  constructor(
    private route: ActivatedRoute,
    private clienFavoriteService: ClienFavoriteService,
    private menuService: MenuService,
    private snackBar: MatSnackBar

  ) { }

  ngOnInit() {
    this.loadFavorite();
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
  }

  loadUserProfile() {
    combineLatest(
      this.menuService.currentUserProfile$,
      this.menuService.currentLinkedSatellite$
    )
      .pipe(
        tap(([userProfile, linkedSatellite]) => {
          this.userProfile = userProfile;
          this.linkedSatellite = linkedSatellite;
        })
      )
      .subscribe(ev => { }, e => console.log(e), () => { });
  }

  loadFavorite() {
    this.route.params
      .pipe(
        map((params: any) => params.id),
        mergeMap((favoriteId: string) => this.menuService.currentUserProfile$
          .pipe(
            filter((userProfile: any) => userProfile),
            map((userProfile: any) => userProfile.favoritePlaces.find(fp => fp.id === favoriteId))
          )
        ),
        filter((favorite: any) => favorite),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((favorite: any) => {
        this.selectedFavorite$.next(favorite);
      }, e => console.log(e));
  }

  mapReady(mapRef) {
    console.log('on map ready');

    this.map = mapRef;
    this.listenSelectedFavoritePlace();
    this.listenMapCenterChanged();

  }

  onCenterChange($event) {
    this.mapCenter$.next($event);
  }

  listenSelectedFavoritePlace() {
    this.selectedFavorite$
      .pipe(
        filter(favoritePlace => favoritePlace)
      ).subscribe((favorite: any) => {
        console.log('selectedFavorite$ ===> ', favorite);

        this.map.setCenter({ lat: favorite.location.lat, lng: favorite.location.lng });

        this.selectedFavorite = favorite;

        this.favoriteName.setValue(favorite.name);
        this.favoriteAddress.setValue(favorite.address);

        this.favoriteMarker = new google.maps.Marker({
          position: { lat: favorite.location.lat, lng: favorite.location.lng },
          icon: '../../../../assets/icons/location/destination-place-30.png',
          map: this.map
        });

        this.favoriteMarker.setPosition({ lat: favorite.location.lat, lng: favorite.location.lng });
      });
  }

  listenMapCenterChanged() {
    this.mapCenter$.pipe(
      filter((center: any) => {
        const isDifferentLocation = this.lastCenterReported && this.lastCenterReported.lat !== center.lat;
        this.lastCenterReported = center;
        return isDifferentLocation;
      }),
    ).subscribe((center: any) => {
      this.favoriteMarker.setPosition({ lat: center.lat, lng: center.lng });
    });
  }

  saveFavorite() {

    const favoritePlaceUpdated = {
      id: this.selectedFavorite.id,
      type: this.selectedFavorite.type,
      address: this.favoriteAddress.value,
      name: this.favoriteName.value,
      referenceName: this.selectedFavorite.referenceName,
      lat: (this.lastCenterReported || {}).lat || this.selectedFavorite.location.lat,
      lng: (this.lastCenterReported || {}).lng || this.selectedFavorite.location.lng
    };

    console.log(favoritePlaceUpdated);

    this.clienFavoriteService.updateFavoritePlace$(favoritePlaceUpdated)
      .pipe(
        map(response => (response.data || {}).UpdateFavoritePlace)

      ).subscribe(result => {
        if (result.code === 200) {
          this.showSnackBar('El lugar favorito ha sido actualizado exitosamente', false);
        }
      });






  }

  showSnackBar(message, showCloseButton = true) {
    this.snackBar.open(message, showCloseButton ? 'Cerrar' : undefined, {
      duration: 2000
    });
  }


}
