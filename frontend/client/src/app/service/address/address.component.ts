import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  NgZone,
  OnDestroy,
  AfterViewInit
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MapsAPILoader } from '@agm/core';
import { ServiceService } from '../service.service';
import { filter, takeUntil, tap, map, startWith } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ServiceState } from '../service-state';
import { MenuService } from 'src/app/menu/menu.service';


@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss']
})
export class AddressComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('originPlaceSearch') originPlaceSearchElementRef: ElementRef;
  originPlace: any = {};
  originPlaceAutocomplete: any;
  originPlaceAddresInput = new FormControl();

  @ViewChild('destinationPlaceSearch') destinationPlaceSearchElementRef: ElementRef;
  destinationPlace: any = {};
  destinationPlaceAutocomplete: any;
  destinationPlaceAddresInput = new FormControl();

  STRINGS_TO_REMOVE = [', Antioquia', ', Valle del Cauca', ', Colombia'];

  private ngUnsubscribe = new Subject();

  layoutType = null;

  showAddress = true;
  showOfferHeader = false;
  showAssignedHeader = false;
  showWithoutService = false;
  showArrivedHeader = false;
  showOnBoardHeader = false;

  userProfile: any; // User profile
  selectedPlace: any = {}; // selected place.

  showTwoInputs = false;

  constructor(
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private serviceService: ServiceService,
    private menuService: MenuService
  ) { }

  ngOnInit() {
    this.loadUserProfile();

    this.listenServiceChanges();
    this.listenLayoutChanges();

    this.listenMarkerPositionChanges();

    // this.buildOriginPlaceAutoComplete();
    this.buildDestinationPlaceAutoComplete();

    this.listenOriginPlaceChanges();
    this.listenDestinationPlaceChanges();

  }

  ngAfterViewInit(): void {
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
      .subscribe(userProfile => this.userProfile = userProfile);
  }

  /**
   * Initialize the google autocomplete
   */
  buildOriginPlaceAutoComplete(circle?) {
    if (!this.originPlaceSearchElementRef) {
      setTimeout(() => {
        if (this.showTwoInputs) {
          this.buildOriginPlaceAutoComplete(circle);
        }
      }, 1000);
      return;
    }


    this.mapsAPILoader.load().then(() => {
      this.originPlaceAutocomplete = new google.maps.places.Autocomplete(
        this.originPlaceSearchElementRef.nativeElement,
        { componentRestrictions: { country: 'co' } }
      );

      this.originPlaceAutocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place: google.maps.places.PlaceResult = this.originPlaceAutocomplete.getPlace();
          // verify result
          if (!place || place.geometry === undefined || place.geometry === null) {
            return;
          }
          const { address_components, name, formatted_address } = place;
          // this.searchControl.setValue(`${place.name}, ${place.formatted_address.split(',').slice(1)}`);

          if (this.selectedPlace.favorite) {
            this.originPlaceAddresInput.setValue(`${name}`.trim());
          } else {
            this.originPlaceAddresInput.setValue(`${name}, ${formatted_address.split(',').slice(1)}`.trim());
          }

          this.STRINGS_TO_REMOVE.forEach(s => this.originPlaceAddresInput.setValue(this.originPlaceAddresInput.value.replace(s, '')));

          this.serviceService.originPlaceSelected$.next({
            name: this.originPlaceAddresInput.value,
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
          });

          // this.serviceService.publishServiceChanges({ state: ServiceState.REQUEST });
          // todo enable when develop eviroment is on
          // if (!this.gateway.checkIfUserLogger()) {
          //    defer(() => this.keycloakService.login({ scope: 'offline_access' }) ).pipe().subscribe();
          // }

        });
      });

      if (!circle) {
        const location = this.serviceService.markerOnMapChange$.getValue();
        if (!location) { return; }
        const latlng = new google.maps.LatLng(location.latitude, location.longitude);
        circle = new google.maps.Circle({
          center: latlng,
          radius: 20000 // meters
        });
      }

      if (circle) {
        this.originPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
      }

    });
  }

  buildDestinationPlaceAutoComplete(circle?) {
    if (!this.destinationPlaceSearchElementRef) {
      setTimeout(() => {
        this.buildDestinationPlaceAutoComplete(circle);
      }, 200);
      return;
    }

    if (this.destinationPlaceSearchElementRef) {
      this.mapsAPILoader.load().then(() => {
        this.destinationPlaceAutocomplete = new google.maps.places.Autocomplete(
          this.destinationPlaceSearchElementRef.nativeElement,
          {
            componentRestrictions: { country: 'co' }
          }
        );

        this.destinationPlaceAutocomplete.addListener('place_changed', () => {
          this.ngZone.run(() => {
            // get the place result
            const place: google.maps.places.PlaceResult = this.destinationPlaceAutocomplete.getPlace();
            // verify result
            if (!place || place.geometry === undefined || place.geometry === null) {
              return;
            }

            // this.addressInputValue = place.formatted_address.split(',')[0];

            const { address_components, name, formatted_address, geometry } = place;


            this.destinationPlace.favorite = (formatted_address === '[FAVORITE]');
            let destinationPlaceName = this.destinationPlace.favorite
              ? `${name}`.trim()
              : `${name}, ${formatted_address.split(',').slice(1)}`.trim();

            this.STRINGS_TO_REMOVE.forEach(s => destinationPlaceName = destinationPlaceName.replace(s, ''));

            this.destinationPlace.name = destinationPlaceName;

            this.serviceService.destinationPlaceSelected$.next({
              ...this.destinationPlace,
              name: this.destinationPlace.name,
              location: {
                lat: geometry.location.lat(),
                lng: geometry.location.lng()
              }
            });
          });
        });

        if (!circle) {
          const location = this.serviceService.markerOnMapChange$.getValue();
          if (!location) { return; }
          const latlng = new google.maps.LatLng(location.latitude, location.longitude);
          circle = new google.maps.Circle({
            center: latlng,
            radius: 20000 // meters
          });
        }

        if (circle) {
          this.destinationPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }
      });
    } else {
      console.log('destinationPlaceSearchElementRef IS NO DEFINED!!!!!!!! ');

    }
  }

  /**
   * listen the marker position changes
   */
  listenMarkerPositionChanges() {
    this.serviceService.markerOnMapChange$
      .pipe(
        filter(evt => evt),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(location => {
        const latlng = new google.maps.LatLng(
          location.latitude,
          location.longitude
        );
        const circle = new google.maps.Circle({
          center: latlng,
          radius: 20000 // meters
        });


        if (!this.originPlaceAutocomplete) {
          this.buildOriginPlaceAutoComplete(circle);
        } else if (this.showAddress) {
          this.originPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }

        if (!this.destinationPlace) {
          this.buildDestinationPlaceAutoComplete(circle);
        } else if (this.showAddress && this.showTwoInputs) {
          this.destinationPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }

      });
  }

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(
        takeUntil(this.ngUnsubscribe),
        filter(service => service)
      )
      .subscribe(service => {
        switch (service.state) {
          case ServiceState.NO_SERVICE:
            this.showTwoInputs = false;
            break;
          case ServiceState.CANCELLED_CLIENT:
            this.showTwoInputs = false;
            break;
          case ServiceState.CANCELLED_DRIVER:
            this.showTwoInputs = false;
            break;
          case ServiceState.CANCELLED_OPERATOR:
            this.showTwoInputs = false;
            break;
          case ServiceState.CANCELLED_SYSTEM:
            this.showTwoInputs = false;
            break;
          case ServiceState.DONE:
            this.showAddress = true;
            this.showOfferHeader = false;
            this.showAssignedHeader = false;
            this.showWithoutService = false;
            this.showArrivedHeader = false;
            this.showOnBoardHeader = true;
            this.showTwoInputs = false;
            break;
          case ServiceState.REQUEST:
            this.showWithoutService = false;
            this.showOfferHeader = false;
            this.showAddress = true;
            this.showAssignedHeader = false;
            this.showArrivedHeader = false;
            this.showOnBoardHeader = false;
            this.showTwoInputs = false;
            if (this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT) {
              this.showTwoInputs = true;
              this.buildOriginPlaceAutoComplete();

            }

            break;
          case ServiceState.REQUESTED:
            this.showOfferHeader = true;
            this.showAddress = false;
            this.showAssignedHeader = false;
            this.showWithoutService = false;
            this.showArrivedHeader = false;
            this.showOnBoardHeader = true;
            this.showTwoInputs = false;
            break;
          case ServiceState.ASSIGNED:
            this.showAssignedHeader = true;
            this.showOfferHeader = false;
            this.showAddress = false;
            this.showWithoutService = false;
            this.showArrivedHeader = false;
            this.showOnBoardHeader = true;
            this.showTwoInputs = false;
            break;
          case ServiceState.ARRIVED:
            this.showAssignedHeader = false;
            this.showOfferHeader = false;
            this.showAddress = false;
            this.showWithoutService = false;
            this.showArrivedHeader = true;
            this.showOnBoardHeader = true;
            this.showTwoInputs = false;
            break;
          case ServiceState.ON_BOARD:
            this.showAssignedHeader = false;
            this.showOfferHeader = false;
            this.showAddress = false;
            this.showWithoutService = false;
            this.showArrivedHeader = false;
            this.showOnBoardHeader = true;
            this.showTwoInputs = false;
            break;
          default:
            this.showWithoutService = true;
            this.showOfferHeader = false;
            this.showAddress = false;
            this.showAssignedHeader = false;
            this.showArrivedHeader = false;
            this.showOnBoardHeader = true;
            this.showTwoInputs = false;
            break;
        }

      });
  }

  listenLayoutChanges() {
    this.serviceService.layoutChanges$
      .pipe(
        filter(update => update),
        map(update => update.layout),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(layout => {

        const { type } = layout;
        this.layoutType = type;

        const serviceState = this.serviceService.currentService$.getValue().state;
        this.showTwoInputs = (serviceState === ServiceState.REQUEST && type === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT);

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
    this.originPlaceAddresInput.valueChanges
      .pipe(
        // map(() => this.searchElementRef.nativeElement.value),
        tap(inputValue => {
          const itemsToAutocomplete = this.searchFavoritePlacesWithMatch(inputValue);
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

    this.originPlaceAutocomplete.set('place', {
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

  listenOriginPlaceChanges() {
    this.serviceService.originPlaceSelected$
      .pipe(
        filter(place => place),
        startWith(({ type: 'INITIAL_MARKER', value: this.serviceService.markerOnMapChange$.getValue() })),
        takeUntil(this.ngUnsubscribe)
      ).subscribe((place: any) => {

        let startWithElement = false;
        if (place.type === 'INITIAL_MARKER') {
          startWithElement = true;
          place = {
            name: 'Mi Posición',
            location: {
              lat: place.latitude,
              lng: place.longitude
            }
          };
        }

        this.originPlace.name = place.name;
        this.originPlace.location = place.location;
        this.originPlaceAddresInput.setValue(this.originPlace.name);


        if (!startWithElement) {
          const latlng = new google.maps.LatLng(place.location.lat, place.location.lng);
          const circle = new google.maps.Circle({ center: latlng, radius: 20000 }); // radius in meters

          // if (!this.originPlaceAutocomplete) {
          //   this.buildOriginPlaceAutoComplete(circle);
          // } else {
          //   this.originPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
          // }
        }

      });
  }


  listenDestinationPlaceChanges() {
    this.serviceService.destinationPlaceSelected$
      .pipe(
        filter(place => place),
        takeUntil(this.ngUnsubscribe)
      ).subscribe((place: any) => {

        this.destinationPlace.name = place.name;
        this.destinationPlaceAddresInput.setValue(this.destinationPlace.name);
        this.destinationPlace.location = place.location;

        const latlng = new google.maps.LatLng(place.location.lat, place.location.lng);
        const circle = new google.maps.Circle({ center: latlng, radius: 20000 }); // radius in meters


        // if (!this.destinationPlaceAutocomplete) {
        //   this.buildDestinationPlaceAutoComplete(circle);
        // } else {
        //   this.destinationPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        // }

      });
  }

}
