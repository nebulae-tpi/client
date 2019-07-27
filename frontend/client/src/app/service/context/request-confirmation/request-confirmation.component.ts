import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  NgZone,
  AfterContentInit,
  AfterViewInit
} from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetRef
} from '@angular/material';
import { ServiceService } from '../../service.service';
import { ServiceState } from '../../service-state';
import { filter, takeUntil, map, tap, mergeMap, startWith } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';
import { Subject, fromEvent, of, merge } from 'rxjs';
import { MapsAPILoader } from '@agm/core';
import { MenuService } from 'src/app/menu/menu.service';
import { FormControl } from '@angular/forms';


@Component({
  selector: 'app-filter-sheet',
  templateUrl: 'filter-sheet.html',
  styleUrls: ['./request-confirmation.component.scss']
})
export class FilterSheetComponent implements OnInit {
  imgVip = '../../../../assets/icons/context/icon_vip.png';
  imgAc = '../../../../assets/icons/context/icon_grill.png';
  imgGrill;
  imgTrunk;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<FilterSheetComponent>,
    private serviceService: ServiceService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.imgVip = this.findRequestFeature('VIP')
      ? '../../../../assets/icons/context/icon_vip_active.png'
      : '../../../../assets/icons/context/icon_vip.png';

    this.imgAc = this.findRequestFeature('AC')
      ? '../../../../assets/icons/context/icon_air_active.png'
      : '../../../../assets/icons/context/icon_air.png';

    this.imgGrill = this.findRequestFeature('ROOF_RACK')
      ? '../../../../assets/icons/context/icon_grill_active.png'
      : '../../../../assets/icons/context/icon_grill.png';

    this.imgTrunk = this.findRequestFeature('TRUNK')
      ? '../../../../assets/icons/context/icon_trunk_active.png'
      : '../../../../assets/icons/context/icon_trunk.png';

    this.cdRef.detectChanges();
  }

  openLink(event: MouseEvent): void {
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }

  enableDisableVip() {
    this.imgVip = this.addRemoveRequestFeature('VIP')
      ? '../../../../assets/icons/context/icon_vip_active.png'
      : '../../../../assets/icons/context/icon_vip.png';
    this.cdRef.detectChanges();
  }

  enableDisableAc() {
    this.imgAc = this.addRemoveRequestFeature('AC')
      ? '../../../../assets/icons/context/icon_air_active.png'
      : '../../../../assets/icons/context/icon_air.png';
    this.cdRef.detectChanges();
  }

  enableDisableGrill() {
    this.imgGrill = this.addRemoveRequestFeature('ROOF_RACK')
      ? '../../../../assets/icons/context/icon_grill_active.png'
      : '../../../../assets/icons/context/icon_grill.png';
    this.cdRef.detectChanges();
  }

  enableDisableTrunk() {
    this.imgTrunk = this.addRemoveRequestFeature('TRUNK')
      ? '../../../../assets/icons/context/icon_trunk_active.png'
      : '../../../../assets/icons/context/icon_trunk.png';
    this.cdRef.detectChanges();
  }

  private addRemoveRequestFeature(requestFeature) {
    let enabled = false;
    const currentService = this.serviceService.currentService$.getValue();
    if (!currentService.requestedFeatures) {
      currentService.requestedFeatures = [];
    }
    const featureFoundIndex = currentService.requestedFeatures.findIndex(element => {
      return element === requestFeature;
    });
    if (featureFoundIndex >= 0) {
      currentService.requestedFeatures.splice(featureFoundIndex, 1);
    } else {
      enabled = true;
      currentService.requestedFeatures.push(requestFeature);
    }
    this.serviceService.publishServiceChanges(currentService);
    return enabled;
  }

  private findRequestFeature(requestFeature) {
    const currentService = this.serviceService.currentService$.getValue();
    if (!currentService.requestedFeatures) {
      currentService.requestedFeatures = [];
    }
    const found = currentService.requestedFeatures.findIndex(element => {
      return element === requestFeature;
    });

    return found >= 0;
  }
}


@Component({
  selector: 'app-request-confirmation',
  templateUrl: './request-confirmation.component.html',
  styleUrls: ['./request-confirmation.component.scss']
})
export class RequestConfirmationComponent implements OnInit, OnDestroy, AfterViewInit {

  locationsConfirmed = false;


  private ngUnsubscribe = new Subject();
  STRINGS_TO_REMOVE = [', Antioquia', ', Valle del Cauca', ', Colombia'];
  tipValue = '0';
  placeReference = '';
  fxFlexTip = 40;
  fxFlexFilter = 40;
  showHeader = true;
  showPlacesInputs = true;
  layoutType = null;
  serviceState = null;
  userProfile: any;


  @ViewChild('originPlaceSearch') originPlaceSearchElementRef: ElementRef;
  originPlace: any = {};
  originPlaceAutocomplete: any;
  originPlaceAddresInput = new FormControl();

  @ViewChild('destinationPlaceSearch') destinationPlaceSearchElementRef: ElementRef;
  destinationPlace: any = {};
  destinationPlaceAutocomplete: any;
  destinationPlaceAddresInput = new FormControl();






  constructor(
    private bottomSheet: MatBottomSheet,
    private serviceService: ServiceService,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private snackBar: MatSnackBar,
    private menuService: MenuService
  ) { }

  ngOnInit() {
    this.loadUserProfile();

    this.listenOriginPlaceChanges();
    this.listenDestinationPlaceChanges();

    this.listenLayoutCommands();
    this.listenServiceChanges();

    this.listenServiceCommands();

  }

  ngAfterViewInit(): void {
    this.buildOriginPlaceAutoComplete();
    this.buildDestinationPlaceAutoComplete();

    this.listenChangesOnOriginAndDestinationSearchInput();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  openBottomSheet(): void {
    this.bottomSheet.open(FilterSheetComponent);
  }

  cancel() {
    this.serviceService.publishServiceChanges({
      state: ServiceState.NO_SERVICE
    });
  }

  showSnackMessage(message) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 2000
    });
  }

  loadUserProfile() {
    this.menuService.currentUserProfile$
      .pipe(
        tap(userProfile => {
          this.userProfile = userProfile;
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();

  }

  searchFavoritePlacesWithMatch(filterText) {
    return (this.userProfile && this.userProfile.favoritePlaces)
      ? this.userProfile.favoritePlaces.filter(favoritePlace => {
        const favoritePlaceName = favoritePlace.name.replace(/\./g, '').trim().toLowerCase();
        const filterTextFixed = `${filterText}`
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
          .toLowerCase();
        return favoritePlaceName.includes(filterTextFixed);
      })
      : [];
  }

  confirmServiceRequest() {



    if (this.originPlace && this.originPlace.name && this.originPlace.name !== '') {
      const pickUpMarker = {
        lat: this.originPlace.location.lat,
        lng: this.originPlace.location.lng
      };

      this.serviceService
        .createNewService$(
          this.serviceService.userProfile.username,
          pickUpMarker,
          this.originPlace.name,
          this.placeReference,
          parseInt(this.tipValue, 10)
        )
        .pipe(
          tap(resp => {
            if (
              resp.errors &&
              resp.errors.extensions &&
              resp.errors.extensions.exception &&
              resp.errors.extensions.exception.code
            ) {
              switch (resp.errors.extensions.exception.code) {
                case 23002:
                  this.showSnackMessage(`Usuario no tiene privilegios para crear servicios, solo los usuarios
                  creados desde el app cliente pueden realizar esta acción`);
                  break;
                case 23002:
                  this.showSnackMessage(
                    'Datos insuficientes para crear el servicio'
                  );
                  break;
                case 23201:
                  this.showSnackMessage('Nombre del cliente inválido');
                  break;
                case 23202:
                  this.showSnackMessage('Tipo de propina invalida');
                  break;
                case 23203:
                  this.showSnackMessage('Valor de propina invalida');
                  break;
                case 23204:
                  this.showSnackMessage('Ubicación de recogida indefinida');
                  break;
                case 23205:
                  this.showSnackMessage(
                    'Dirección de recogida no especificada'
                  );
                  break;
                case 23206:
                  this.showSnackMessage('Tipo de pago inválido');
                  break;
                case 23212:
                  this.showSnackMessage(
                    'Actualmente ya se tiene una solicitud pendiente, por favor finalizar la actual para poder solicitar una nueva'
                  );
                  break;
                default:
                  this.showSnackMessage(
                    'Fallo al solicitar el servicio, por favor intalo de nuevo mas tarde'
                  );
                  break;
              }
            }
          })
        )
        .subscribe(
          res => {
            console.log('Llega resultado: ', res);
          },
          error => {
            this.showSnackMessage(
              'Fallo al solicitar el servicio, por favor intalo de nuevo mas tarde'
            );
            console.log('Error solicitando servicio: ', error);
          }
        );
    } else {
      this.snackBar.open('Por favor ingresar una dirección para el punto de recogida', 'Cerrar',
        { duration: 2000 }
      );
    }
  }

  listenServiceCommands() {
    this.serviceService.serviceCommands$
      .pipe(
        filter(command => command && command.code),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(command => {
        switch (command.code) {
          case ServiceService.COMMAND_ON_CONFIRM_BTN:

            console.log('HACER EL CALCULO DE LA TARIFA Y MOSTRAR EL CAMINO');
            if (this.locationsConfirmed) {
              this.confirmServiceRequest();
            }

            break;

          default:
            break;
        }
      });
  }

  onConfirmButton() {
    this.serviceService.publishCommand({
      code: ServiceService.COMMAND_ON_CONFIRM_BTN,
      args: []
    });

  }


  listenChangesOnOriginAndDestinationSearchInput() {
    if (!this.showPlacesInputs) {
      return;
    }
    merge(
      fromEvent(this.originPlaceSearchElementRef.nativeElement, 'keyup').pipe(
        map(input => ({ type: 'ORIGIN', value: input }))
      ),
      fromEvent(this.destinationPlaceSearchElementRef.nativeElement, 'keyup').pipe(
        map(input => ({ type: 'DESTINATION', value: input }))
      )
    ).pipe(
      filter((change: any) => change && change.value),
      takeUntil(this.ngUnsubscribe)
    )
      .subscribe((onchange: any) => {
        const itemsToAutocomplete = this.searchFavoritePlacesWithMatch(onchange.value);
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
            node.addEventListener('mousedown', () => this.onFavoriteResultClick(e, onchange.type));
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


  onFavoriteResultClick(favoriteSelected, placeType: string) {
    switch (placeType) {
      case 'ORIGIN':
        this.originPlace.favorite = true;

        this.originPlaceAutocomplete.set('place', {
          name: favoriteSelected.name,
          formatted_address: '[FAVORITE]',
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
          formatted_address: '[FAVORITE]',
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

  buildOriginPlaceAutoComplete(circle?) {
    if (this.originPlaceSearchElementRef) {
      this.mapsAPILoader.load().then(() => {
        this.originPlaceAutocomplete = new google.maps.places.Autocomplete(
          this.originPlaceSearchElementRef.nativeElement,
          {
            componentRestrictions: { country: 'co' }
          }
        );

        this.originPlaceAutocomplete.addListener('place_changed', () => {
          this.ngZone.run(() => {
            // get the place result
            const place: google.maps.places.PlaceResult = this.originPlaceAutocomplete.getPlace();
            // verify result
            if (!place || place.geometry === undefined || place.geometry === null) {
              return;
            }

            // this.addressInputValue = place.formatted_address.split(',')[0];

            const { address_components, name, formatted_address, geometry } = place;

            this.originPlace.favorite = (formatted_address === '[FAVORITE]');
            let originPlaceName = this.originPlace.favorite
              ? `${name}`.trim()
              : `${name}, ${formatted_address.split(',').slice(1)}`.trim();

            this.STRINGS_TO_REMOVE.forEach(s => originPlaceName = originPlaceName.replace(s, ''));

            this.originPlace.name = originPlaceName;

            this.serviceService.originPlaceSelected$.next({
              ...this.originPlace,
              name: this.originPlace.name,
              location: {
                lat: geometry.location.lat(),
                lng: geometry.location.lng()
              }
            });
          });
        });

        if (circle) {
          this.originPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }
      });
    }
  }

  buildDestinationPlaceAutoComplete(circle?) {
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
          console.log('POSICION RECUPERADA ===>', location);
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
  }

  listenOriginPlaceChanges() {
    this.serviceService.originPlaceSelected$
      .pipe(
        filter(place => place),
        startWith(({ type: 'INITIAL_MARKER', value: this.serviceService.markerOnMapChange$.getValue() })),
        takeUntil(this.ngUnsubscribe)
      ).subscribe((place: any) => {

        if (place.type === 'INITIAL_MARKER') {
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

        const latlng = new google.maps.LatLng(place.location.lat, place.location.lng);
        const circle = new google.maps.Circle({ center: latlng, radius: 20000 }); // radius in meters


        if (!this.originPlaceAutocomplete) {
          this.buildOriginPlaceAutoComplete(circle);
        } else {
          this.originPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
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


        if (!this.destinationPlaceAutocomplete) {
          this.buildDestinationPlaceAutoComplete(circle);
        } else {
          this.destinationPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }

      });
  }

  /**
   * listen layout commands to hide nd show some components.
   */
  listenLayoutCommands() {
    this.serviceService.layoutChanges$
      .pipe(
        filter(command => command && command.layout),
        map(update => update.layout),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(layout => {
        const { type } = layout;
        this.layoutType = type;
        if (type === 0 || type === 1 || type === 4 || type === 5) {
          this.fxFlexTip = 100;
          this.fxFlexFilter = 100;
          this.showHeader = false;
        } else {
          this.fxFlexTip = 40;
          this.fxFlexFilter = 40;
          this.showHeader = true;
        }

        this.serviceState = this.serviceState || this.serviceService.currentService$.getValue().state;



        this.showPlacesInputs = !(
          this.serviceState === ServiceState.REQUEST &&
          this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT
        );


      }
      );
  }

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(
        filter(service => service),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(service => {
        const { state } = service;
        this.serviceState = state;

        this.showPlacesInputs = !(
          this.serviceState === ServiceState.REQUEST &&
          this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT
        );


      });
  }


  /**
   *
   * @param placeType string ORIGIN || DESTINATION
   */
  toggleFavoritePlace(placeType: string) {

    if (placeType !== 'ORIGIN' && placeType !== 'DESTINATION') { return; }
    if (placeType === 'ORIGIN') {
      if (!this.originPlace || !this.originPlace.name || !this.originPlace.location) {
        console.log('MISSING INFO IN SELECTED PLACE');
        return;
      }
      this.originPlace.favorite = !this.originPlace.favorite;

    }

    if (placeType === 'DESTINATION') {
      if (!this.destinationPlace || !this.destinationPlace.name || !this.destinationPlace.location) {
        console.log('MISSING INFO IN SELECTED PLACE');
        return;
      }
      this.destinationPlace = !this.destinationPlace.favorite;
    }

    const selectedPlace = placeType === 'ORIGIN' ? this.originPlace : this.destinationPlace;


    of(selectedPlace.favorite)
      .pipe(
        map(toInsert => toInsert ? ({
          type: 'other',
          name: selectedPlace.name,
          lat: selectedPlace.location.lat,
          lng: selectedPlace.location.lng
        })
          : ({ id: selectedPlace.id, name: selectedPlace.name })
        ),
        mergeMap(args => selectedPlace.favorite
          ? this.serviceService.addFavoritePlace$(args)
          : this.serviceService.removeFavoritePlace$(args.id, args.name)
        ),
        map(response => ((response || {}).data || {})),
        tap(response => {
          if ((response.AddFavoritePlace || {}).code === 200) {
            this.userProfile.favoritePlaces.push({
              type: 'other',
              name: selectedPlace.name,
              location: selectedPlace.location
            });
            this.menuService.currentUserProfile$.next(this.userProfile);
            this.showSnackMessage('Favorito Agregado');
          } else if ((response.RemoveFavoritePlace || {}).code === 200) {
            this.userProfile.favoritePlaces = this.userProfile.favoritePlaces.filter(fp => fp.name !== selectedPlace.name);
            this.menuService.currentUserProfile$.next(this.userProfile);
            this.showSnackMessage('Favorito Eliminado');
          }
        })
      )
      .subscribe();
  }

}
