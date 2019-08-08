import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  map,
  mergeMap,
  takeUntil,
  tap,
  filter,
  debounceTime
} from 'rxjs/operators';
import {
  Subject,
  Observable,
  combineLatest,
  fromEvent,
  of,
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
  readOnlyName = false;
  favoriteAddress = new FormControl();
  map: google.maps.Map;
  mapZoom = 16;
  mapHeight = 415;
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
    this.listenscreenSizeChanges();
    this.loadFavorite();
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
  }

  listenscreenSizeChanges() {
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(50),
        map(event => event.currentTarget),
        map((target: any) => ({ height: target.innerHeight, width: target.innerWidth })),
      ).subscribe(size => {
        this.calculateHeihtUsage(size);
      });
  }

  calculateHeihtUsage(sizes) {

    const wasteHeight = 100;
    const inputsOnTopHeight = document.getElementById('input-fields').offsetHeight;
    const confirmationButtonHeight = document.getElementById('save-button').offsetHeight;

    this.mapHeight = sizes.height - (inputsOnTopHeight + confirmationButtonHeight + wasteHeight);


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

    this.map = mapRef;
    this.listenSelectedFavoritePlace();
    this.listenMapCenterChanged();
    this.calculateHeihtUsage({ height: innerHeight, width: innerWidth });

  }

  onCenterChange($event) {
    this.mapCenter$.next($event);
  }

  listenSelectedFavoritePlace() {
    this.selectedFavorite$
      .pipe(
        filter(favoritePlace => favoritePlace),
        mergeMap(favoriteplace => this.validateLocation$(favoriteplace) )
      ).subscribe((favorite: any) => {
        console.log('selectedFavorite$ ===> ', favorite);

        this.map.setCenter({ lat: favorite.location.lat, lng: favorite.location.lng });

        this.selectedFavorite = favorite;

        this.readOnlyName = favorite.type === 'home' || favorite.type === 'work';

        this.favoriteName.setValue(favorite.name);
        this.favoriteAddress.setValue(favorite.address);

        this.favoriteMarker = this.favoriteMarker || new google.maps.Marker({
          position: { lat: favorite.location.lat, lng: favorite.location.lng },
          icon: '../../../../assets/icons/location/destination-place-30.png',
          map: this.map
        });

        this.favoriteMarker.setPosition({ lat: favorite.location.lat, lng: favorite.location.lng });
      });
  }

  validateLocation$(favoritePlace) {
    if (!favoritePlace.location.lat || favoritePlace.location.lat === 0) {
      return this.mapCenter$
      .pipe(
        filter((center: any) => center),
        map(center => ({
          ...favoritePlace,
          location: {
            lat: center.lat,
            lng: center.lng
          }
        }))
      );
    } else {
      return of(favoritePlace);
    }

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

    const newFavoritePlaces = this.userProfile.favoritePlaces.map((fp) => {
      if (fp.id === favoritePlaceUpdated.id) {
        return {
          address: favoritePlaceUpdated.address,
          id: favoritePlaceUpdated.id,
          location: {
            lat: favoritePlaceUpdated.lat,
            lng: favoritePlaceUpdated.lng
          },
          name: favoritePlaceUpdated.name,
          referenceName: favoritePlaceUpdated.referenceName,
          type: favoritePlaceUpdated.type
        };
      }
      return fp;
    });


    console.log(favoritePlaceUpdated);

    this.clienFavoriteService.updateFavoritePlace$(favoritePlaceUpdated)
      .pipe(
        map(response => (response.data || {}).UpdateFavoritePlace)

      ).subscribe(result => {
        if (result.code === 200) {
          this.menuService.currentUserProfile$.next({
            ...this.userProfile,
            favoritePlaces: newFavoritePlaces
          });
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
