import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  NgZone,
  OnDestroy
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MapsAPILoader } from '@agm/core';
import { ServiceService } from '../service.service';
import { filter, takeUntil, tap, map } from 'rxjs/operators';
import { Subject, fromEvent } from 'rxjs';
import { ServiceState } from '../service-state';
import { MenuService } from 'src/app/menu/menu.service';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss']
})
export class AddressComponent implements OnInit, OnDestroy {
  public searchControl = new FormControl();

  @ViewChild('search')
  public searchElementRef: ElementRef;
  private ngUnsubscribe = new Subject();
  // addressInputValue = '';
  autocomplete: any;
  showAddress = true;
  showOfferHeader = false;
  showAssignedHeader = false;
  showWithoutService = false;
  showArrivedHeader = false;
  showOnBoardHeader = false;

  userProfile: any; // User profile
  selectedPlace: any = {}; // selected place.

  constructor(
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private serviceService: ServiceService,
    private menuService: MenuService
  ) { }

  ngOnInit() {
    this.listenServiceChanges();
    this.listenLocationChanges();
    this.buildPlacesAutoComplete();
    this.loadUserProfile();
    this.listenChangesOnAddressSearchInput();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Load user profile from menu service
   */
  loadUserProfile() {
    this.menuService.currentUserProfile$
      .pipe(
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(userProfile => this.userProfile = userProfile,
        e => console.log(e),
        () => { }
      );

  }

  /**
   * Initialize the google autocomplete
   */
  buildPlacesAutoComplete(circle?) {
    if (!this.showAddress) { return; }
    this.mapsAPILoader.load().then(() => {
      this.autocomplete = new google.maps.places.Autocomplete(
        this.searchElementRef.nativeElement,
        { componentRestrictions: { country: 'co' } }
      );

      this.autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place: google.maps.places.PlaceResult = this.autocomplete.getPlace();
          // verify result
          if (!place || place.geometry === undefined || place.geometry === null) {
            return;
          }
          const { address_components, name, formatted_address } = place;
          const stringsToRemove = [', Antioquia', ', Valle del Cauca', ', Colombia'];
          // this.searchControl.setValue(`${place.name}, ${place.formatted_address.split(',').slice(1)}`);

          if (this.selectedPlace.favorite) {
            this.searchControl.setValue(`${name}`.trim());
          } else {
            this.searchControl.setValue(`${name}, ${formatted_address.split(',').slice(1)}`.trim());
          }

          stringsToRemove.forEach(s => this.searchControl.setValue(this.searchControl.value.replace(s, '')));
          // place.formatted_address.split(',')[0];

          // this.serviceService.locationChange$.next({
          //   latitude: place.geometry.location.lat(),
          //   longitude: place.geometry.location.lng()
          // });
          // this.serviceService.fromAddressLocation = true;
          // this.serviceService.addressChange$.next(this.searchControl.value);

          this.serviceService.originPlaceSelected$.next({
            name: this.searchControl.value,
            coords: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
          });
          // set latitude, longitude and zoom
          /*
            this.latitude = place.geometry.location.lat();
            this.longitude = place.geometry.location.lng();
            this.zoom = 12;
            */
        });
      });

      if (circle) {
        this.autocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
      }

    });
  }

  /**
   * listen the marker position changes
   */
  listenLocationChanges() {
    this.serviceService.locationChange$
      .pipe(
        filter(evt => evt),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(location => {
        console.log('this.serviceService.locationChange$ ==>', location);
        const latlng = new google.maps.LatLng(
          location.latitude,
          location.longitude
        );
        const circle = new google.maps.Circle({
          center: latlng,
          radius: 20000 // meters
        });
        if (!this.autocomplete) {
          this.buildPlacesAutoComplete(circle);
        } else if (this.showAddress) {
          this.autocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }
      });
  }

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(service => {
        // console.log('Se escucha service: ', service);
        if (service) {
          switch (service.state) {
            case ServiceState.NO_SERVICE:
            case ServiceState.CANCELLED_CLIENT:
            case ServiceState.CANCELLED_DRIVER:
            case ServiceState.CANCELLED_OPERATOR:
            case ServiceState.CANCELLED_SYSTEM:
            case ServiceState.DONE:
              this.showAddress = true;
              this.showOfferHeader = false;
              this.showAssignedHeader = false;
              this.showWithoutService = false;
              this.showArrivedHeader = false;
              this.showOnBoardHeader = true;
              break;
            case ServiceState.REQUESTED:
              this.showOfferHeader = true;
              this.showAddress = false;
              this.showAssignedHeader = false;
              this.showWithoutService = false;
              this.showArrivedHeader = false;
              this.showOnBoardHeader = true;
              break;
            case ServiceState.ASSIGNED:
              this.showAssignedHeader = true;
              this.showOfferHeader = false;
              this.showAddress = false;
              this.showWithoutService = false;
              this.showArrivedHeader = false;
              this.showOnBoardHeader = true;
              break;
            case ServiceState.ARRIVED:
              this.showAssignedHeader = false;
              this.showOfferHeader = false;
              this.showAddress = false;
              this.showWithoutService = false;
              this.showArrivedHeader = true;
              this.showOnBoardHeader = true;
              break;
            case ServiceState.ON_BOARD:
              this.showAssignedHeader = false;
              this.showOfferHeader = false;
              this.showAddress = false;
              this.showWithoutService = false;
              this.showArrivedHeader = false;
              this.showOnBoardHeader = true;
              break;
            default:
              this.showWithoutService = true;
              this.showOfferHeader = false;
              this.showAddress = false;
              this.showAssignedHeader = false;
              this.showArrivedHeader = false;
              this.showOnBoardHeader = true;
              break;
          }
        }
      });
  }

  onBlurAddress() {
    // this.serviceService.addressChange$.next(this.addressInputValue);
  }

  /**
   * search favorite places using the filter text
   * @param filterText filter to search in favorite places
   */
  searchFavoritePlacesWithMatch(filterText: string) {
    return (this.userProfile && this.userProfile.favoritePlaces)
      ? this.userProfile.favoritePlaces.filter(e => {
        const eName = e.name.replace(/\./g, '').trim().toLowerCase();
        const filterTextFixed = `${filterText}`
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
          .toLowerCase();
        return eName.includes(filterTextFixed);
      })
      : [];
  }

  listenChangesOnAddressSearchInput() {
    if (!this.showAddress) { return; }
    fromEvent(this.searchElementRef.nativeElement, 'keyup')
      .pipe(
        map(() => this.searchElementRef.nativeElement.value),
        tap(inputValue => {
          const itemsToAutocomplete = this.searchFavoritePlacesWithMatch(inputValue);
          // console.log('ITEMS PARA AÑADIR', itemsToAutocomplete);
          const s = document.getElementsByClassName('pac-container pac-logo');
          const items = Array.from(s);

          items.forEach(optionsParent => {
            // remove all previuos favorite options
            const itemsToRemove = optionsParent.getElementsByClassName('favorite-place');
            while (itemsToRemove[0]) {
              itemsToRemove[0].parentNode.removeChild(itemsToRemove[0]);
            }

            itemsToAutocomplete.forEach(e => {
              const node = document.createElement('div');
              node.setAttribute('class', 'pac-item');
              node.addEventListener('mousedown', () => this.onFavoriteResultClick(e));
              node.setAttribute('class', 'pac-item favorite-place');
              node.innerHTML = `
              <span class="pac-icon pac-icon-marker-fav"></span>
              <span class="pac-item-query">
              <span class="pac-matched">${e.name}</span></span>
              `;
              optionsParent.insertBefore(node, optionsParent.firstChild);
            });
          });
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  onFavoriteResultClick(favoriteSelected) {
    this.selectedPlace.favorite = true;

    this.autocomplete.set('place', {
      name: favoriteSelected.name,
      formatted_address: '[FAVORITE]', // todo check
      geometry: {
        location: {
          lat: () => favoriteSelected.location.lat,
          lng: () => favoriteSelected.location.lng
        }
      }
    });
  }


}
