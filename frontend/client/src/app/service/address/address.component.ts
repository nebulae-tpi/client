import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  NgZone,
  OnDestroy,
  AfterViewInit
} from '@angular/core';
import { ServiceService } from '../service.service';
import { filter, takeUntil, tap, map, startWith, distinctUntilChanged, switchMap, mergeMap } from 'rxjs/operators';
import { Subject, fromEvent, BehaviorSubject, merge, of } from 'rxjs';
import { ServiceState } from '../service-state';
import { MenuService } from 'src/app/menu/menu.service';
import { MatSnackBar } from '@angular/material';


@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss']
})
export class AddressComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('originPlaceSearch') originPlaceSearchElementRef: ElementRef;
  originPlace: any = {};
  originPlaceAutocomplete: any;

  @ViewChild('destinationPlaceSearch') destinationPlaceSearchElementRef: ElementRef;
  destinationPlace: any = {};
  destinationPlaceAutocomplete: any;

  STRINGS_TO_REMOVE = [', Antioquia', ', Valle del Cauca', ', Colombia'];

  private ngUnsubscribe = new Subject();
  private updateListenersOnInputs = new Subject();

  layoutType = null;

  showAddress = true;
  showOfferHeader = false;
  showAssignedHeader = false;
  showWithoutService = false;
  showArrivedHeader = false;
  showOnBoardHeader = false;

  userProfile: any; // User profile
  // selectedPlace: any = {}; // selected place.

  showTwoInputs = false;
  currentServiceState = null;

  constructor(
    private ngZone: NgZone,
    private serviceService: ServiceService,
    private menuService: MenuService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {

    this.loadUserProfile();


    this.listenServiceChanges();
    this.listenLayoutChanges();

    this.listenMarkerPositionChanges();

    this.listenOriginPlaceChanges();
    this.listenDestinationPlaceChanges();

    this.listenServiceCommands();


  }

  ngAfterViewInit(): void {
    this.listenChangesOnOriginaAndDestinationPlaceInput();

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
        if (this.showAddress && this.showTwoInputs) {
          this.buildOriginPlaceAutoComplete(circle);
        }
      }, 500);
      return;
    }

    this.serviceService.mapsApiLoaded$
      .pipe(
        filter(loaded => loaded),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(() => {
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
            this.originPlace.favorite = (formatted_address === '[FAVORITE]');

            if (this.originPlace.favorite) {
              // this.originPlaceAddresInput.setValue(`${name}`.trim());
              this.originPlaceSearchElementRef.nativeElement.value = `${name}`.trim();
            } else {
              this.originPlaceSearchElementRef.nativeElement.value = `${name}, ${formatted_address.split(',').slice(1)}`.trim();
            }

            let valueForOriginPlace = this.originPlaceSearchElementRef.nativeElement.value;
            this.STRINGS_TO_REMOVE.forEach(s =>
              // this.originPlaceAddresInput.setValue(this.originPlaceAddresInput.value.replace(s, ''))
              valueForOriginPlace = valueForOriginPlace.replace(s, '')
            );
            this.originPlaceSearchElementRef.nativeElement.value = valueForOriginPlace;


            this.serviceService.publishOriginPlace({
              name: this.originPlaceSearchElementRef.nativeElement.value,
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
          circle = new google.maps.Circle({
            center: { lat: location.latitude, lng: location.longitude },
            radius: 20000 // meters
          });
        }

        if (circle) {
          this.originPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
          // this.originPlaceAutocomplete.setBounds(circle.getBounds());
        }

      });

  }

  buildDestinationPlaceAutoComplete(circle?) {
    if (!this.destinationPlaceSearchElementRef) {
      setTimeout(() => {
        if (this.showAddress) {
          this.buildDestinationPlaceAutoComplete(circle);
        }
      }, 500);
      return;
    }

    this.serviceService.mapsApiLoaded$.pipe(
      filter(loaded => loaded)
    ).subscribe(() => {
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
            address: this.destinationPlace.favorite ? this.destinationPlace.address : formatted_address,
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
        const circle = new google.maps.Circle({
          center: { lat: location.latitude, lng: location.longitude },
          radius: 20000 // meters
        });


        if (!this.originPlaceAutocomplete) {
          this.buildOriginPlaceAutoComplete(circle);
        } else if (this.showAddress && this.showTwoInputs) {
          this.originPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }

        if (!this.destinationPlace) {
          this.buildDestinationPlaceAutoComplete(circle);
        } else if (this.showAddress && this.destinationPlaceAutocomplete) {
          this.destinationPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }

      });
  }


  showSnackMessage(message) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 2000
    });
  }

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(
        takeUntil(this.ngUnsubscribe),
        filter(service => service),
        // distinctUntilChanged((a, b) => a.state === b.state)
      )
      .subscribe(service => {

        this.currentServiceState = service.state;
        switch (this.currentServiceState) {
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
            // this.listenChangesOnOriginaAndDestinationPlaceInput();
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
            // this.listenChangesOnOriginaAndDestinationPlaceInput();
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

        this.showTwoInputs = (
          this.currentServiceState === ServiceState.REQUEST
          && type === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT
        );
        // this.listenChangesOnOriginaAndDestinationPlaceInput();

      });
  }

  listenServiceCommands() {

    this.serviceService.serviceCommands$
      .pipe(
        filter((command: any) => command && command.code)
      ).subscribe((command: any) => {



        switch (command.code) {
          case ServiceService.COMMAND_USE_FAVORITE_PLACE_TO_REQUEST_SERVICE:

            const place = command.args[0].place;
            if (command.args[0] && command.args[0].type === 'ORIGIN' && place) {
              this.originPlace = {
                name: place.name,
                address: place.address,
                location: place.location,
                favorite: true
              };

              this.serviceService.publishOriginPlace(this.originPlace);

              this.serviceService.publishServiceChanges({ state: ServiceState.NO_SERVICE });
              this.serviceService.publishServiceChanges({ state: ServiceState.REQUEST });
              this.buildDestinationPlaceAutoComplete();


            }


            break;

          default:
            break;
        }
      });
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

  listenChangesOnOriginaAndDestinationPlaceInput() {

    this.updateListenersOnInputs.next(true);

    merge(
      (this.originPlaceSearchElementRef || { nativeElement: null }).nativeElement
        ? fromEvent(this.originPlaceSearchElementRef.nativeElement, 'keyup').pipe(
          map(input => ({ type: 'ORIGIN', value: this.originPlaceSearchElementRef.nativeElement.value }))
        )
        : of(null),
      (this.destinationPlaceSearchElementRef || { nativeElement: null }).nativeElement
        ? fromEvent(this.destinationPlaceSearchElementRef.nativeElement, 'keyup').pipe(
          map(input => ({ type: 'DESTINATION', value: this.destinationPlaceSearchElementRef.nativeElement.value }))
        )
        : of(null)
    ).pipe(
      filter(value => value),
      takeUntil(merge(this.ngUnsubscribe, this.updateListenersOnInputs)),
    ).subscribe(input => {
      const itemsToAutocomplete = this.searchFavoritePlacesWithMatch(input.value);
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
          node.addEventListener('mousedown', () => this.onFavoriteResultClick(e, input.type));
          node.setAttribute('class', 'pac-item favorite-place');
          node.innerHTML = `
            <span class="pac-icon pac-icon-marker-fav"></span>
            <span class="pac-item-query">
            <span class="pac-matched">${e.name}</span></span>
            `;
          optionsParent.insertBefore(node, optionsParent.firstChild);
        });
      });

    });
  }

  onFavoriteResultClick(favoriteSelected, type: string) {
    switch (type) {
      case 'ORIGIN':
        this.originPlace.favorite = true;
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
        break;
      case 'DESTINATION':
        this.destinationPlace.favorite = true;
        this.destinationPlaceAutocomplete.set('place', {
          name: favoriteSelected.name,
          formatted_address: '[FAVORITE]', // todo check
          geometry: {
            location: {
              lat: () => favoriteSelected.location.lat,
              lng: () => favoriteSelected.location.lng
            }
          }
        });
        break;
    }

  }

  listenOriginPlaceChanges() {
    this.serviceService.originPlaceSelected$
      .pipe(
        filter(place => place),
        filter(place => {
          if (place.name === null && place.location === null) {
            this.originPlace = {};
            return false;
          }
          return true;
        }),
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
        this.originPlaceSearchElementRef.nativeElement.value = this.originPlace.name;




        // if (!startWithElement) {
        //   const latlng = new google.maps.LatLng(place.location.lat, place.location.lng);
        //   const circle = new google.maps.Circle({ center: latlng, radius: 20000 }); // radius in meters

        //   // if (!this.originPlaceAutocomplete) {
        //   //   this.buildOriginPlaceAutoComplete(circle);
        //   // } else {
        //   //   this.originPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        //   // }
        // }

      });
  }

  listenDestinationPlaceChanges() {
    this.serviceService.destinationPlaceSelected$
      .pipe(
        filter(place => place),
        takeUntil(this.ngUnsubscribe)
      ).subscribe((place: any) => {

        this.destinationPlace.name = place.name;
        if (this.destinationPlaceSearchElementRef) {
          this.destinationPlaceSearchElementRef.nativeElement.value = this.destinationPlace.name;
        }

        this.destinationPlace.location = place.location;

        const latlng = new google.maps.LatLng(place.location.lat, place.location.lng);
        const circle = new google.maps.Circle({ center: latlng, radius: 20000 }); // radius in meters


        if (!this.destinationPlaceAutocomplete) {
          this.buildDestinationPlaceAutoComplete(circle);
        } else {
          this.destinationPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }

      });
  }

  toogleFavoritePlace(type: string) {

    const place = type === 'ORIGIN' ? this.originPlace : this.destinationPlace;
    if (!place || !place.name) { return; }

    if (type === 'ORIGIN') {
      this.originPlace.favorite = !this.originPlace.favorite;
    } else {
      this.destinationPlace.favorite = !this.destinationPlace.favorite;
    }

    of(place.favorite)
      .pipe(
        mergeMap(newState => newState
          ? this.serviceService.addFavoritePlace$({
            type: 'other',
            name: place.name,
            address: place.name,
            lat: place.location.lat,
            lng: place.location.lng
          })
          : this.serviceService.removeFavoritePlace$(place.id, place.name)
        ),
        map(response => ({
          operation: (response.data || {}).AddFavoritePlace ? 'ADD' : (response.data || {}).RemoveFavoritePlace ? 'REMOVE' : undefined,
          result: ((response.data || {}).AddFavoritePlace || (response.data || {}).RemoveFavoritePlace || {}).code
        }))
      ).subscribe(data => {
        console.log(data);
        if (data.result === 200) {
          const operation = data.operation === 'ADD' ? 'Agregado' : 'Eliminado';
          this.showSnackMessage(`El lugar favorito ha sido ${operation} correctamente`);

        } else {
          if (type === 'ORIGIN') {
            this.originPlace.favorite = !this.originPlace.favorite;
          } else {
            this.destinationPlace.favorite = !this.destinationPlace.favorite;
          }
        }

      });

  }

}
