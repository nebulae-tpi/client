import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';
import {
  MatIconRegistry,
  MatBottomSheet,
  MatBottomSheetRef
} from '@angular/material';
import { ServiceService } from '../../service.service';
import { ServiceState } from '../../service-state';
import { filter, takeUntil, map, tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';
import { Subject, fromEvent } from 'rxjs';
import { MapsAPILoader } from '@agm/core';


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
    const found = currentService.requestedFeatures.findIndex(element => {
      return element === requestFeature;
    });
    if (found >= 0) {
      currentService.requestedFeatures.splice(found, 1);
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
export class RequestConfirmationComponent implements OnInit, OnDestroy {
  tipValue = '0';
  reference = '';
  currentAddress = '';
  fxFlexTip = 40;
  fxFlexFilter = 40;
  addressInputValue: string;
  autocomplete: any;
  showHeader = true;
  @ViewChild('search')
  public searchElementRef: ElementRef;
  private ngUnsubscribe = new Subject();




  // Selected place
  selectedPlace: any = {};



  constructor(
    private bottomSheet: MatBottomSheet,
    private serviceService: ServiceService,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.listenAddressChanges();
    this.listenLayoutCommands();
    this.listenLocationChanges();
    this.buildPlacesAutoComplete();
    this.addressInputValue = this.serviceService.addressChange$.getValue();

    this.listenChangesOnSearch();
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

  searchFavoritePlacesWithMatch(filterText) {
    return [
      {
        name: 'Casa de mi tia',
        location: {
          lat: 1,
          lng: 2
        }
      },
      {
        name: 'Universidad',
        location: {
          lat: 1,
          lng: 2
        }
      },
    ].filter(e => {
      const eName = e.name.replace(/\./g,'').trim().toLowerCase();
      const filterTextFixed = `${filterText}`
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // remove accents
            .toLowerCase();
      return eName.includes(filterTextFixed);
    })
  }

  confirmService() {
    if (this.addressInputValue && this.addressInputValue !== '') {
      const pickUpMarker = {
        lat: this.serviceService.locationChange$.getValue().latitude,
        lng: this.serviceService.locationChange$.getValue().longitude
      };
      this.serviceService
        .createNewService$(
          this.serviceService.userProfile.username,
          pickUpMarker,
          this.addressInputValue,
          this.reference,
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
      this.snackBar.open(
        'Por favor ingresar una dirección para el punto de recogida',
        'Cerrar',
        {
          duration: 2000
        }
      );
    }
  }

  listenChangesOnSearch() {
    fromEvent(this.searchElementRef.nativeElement, 'keyup')
      .pipe(
        map(() => this.searchElementRef.nativeElement.value),
        tap(inputValue => {

          const itemsToAutocomplete = this.searchFavoritePlacesWithMatch(inputValue);
          console.log('ITEMS PARA AÑADIR', itemsToAutocomplete);
          const s = document.getElementsByClassName("pac-container pac-logo");
          let items = Array.from(s);


          items.forEach(optionsParent => {
            // remove all previuos favorite options
            let itemsToRemove = optionsParent.getElementsByClassName('favorite-place');
            while (itemsToRemove[0]) {
              itemsToRemove[0].parentNode.removeChild(itemsToRemove[0])
            }

            itemsToAutocomplete.forEach(e => {

              const node = document.createElement('div');
              node.setAttribute('class', 'pac-item');
              node.setAttribute('class', 'pac-item favorite-place');
              node.innerHTML = `
              <span class="pac-icon pac-icon-marker"></span>
              <span class="pac-item-query">
              <span class="pac-matched">${e.name}</span></span>
              `;

              // <span>03, Providencia and Santa Catalina Islands, San Andrés and Providencia, Colombia</span>

              optionsParent.insertBefore(node, optionsParent.firstChild);

            })



            // const node = document.createElement('div');
            // node.setAttribute('class', 'pac-item');
            // node.setAttribute('class', 'pac-item favorite-place');
            // node.innerHTML = `
            // <span class="pac-icon pac-icon-marker"></span>
            // <span class="pac-item-query">
            // <span class="pac-matched">Felipe</span> Diving Center</span>
            // <span>03, Providencia and Santa Catalina Islands, San Andrés and Providencia, Colombia</span>
            // `;

            // optionsParent.insertBefore(node, optionsParent.firstChild);


          });



        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe()
  }

  buildPlacesAutoComplete() {
    if (this.searchElementRef) {
      this.mapsAPILoader.load().then(() => {
        this.autocomplete = new google.maps.places.Autocomplete(
          this.searchElementRef.nativeElement,
          {
            componentRestrictions: { country: 'co' }
          }
        );

        this.autocomplete.addListener('place_changed', () => {
          this.ngZone.run(() => {
            // get the place result
            const place: google.maps.places.PlaceResult = this.autocomplete.getPlace();
            // verify result
            if (!place || place.geometry === undefined || place.geometry === null) {
              return;
            }
            // this.addressInputValue = place.formatted_address.split(',')[0];

            const { address_components, name, formatted_address } = place;
            const stringsToRemove = [', Antioquia', ', Valle del Cauca', ', Colombia'];
            this.addressInputValue = `${name}, ${formatted_address.split(',').slice(1)}`;
            stringsToRemove.forEach(s => this.addressInputValue = this.addressInputValue.replace(s, ''));

            this.serviceService.locationChange$.next({
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng()
            });
            this.serviceService.fromAddressLocation = true;
            this.serviceService.addressChange$.next(this.addressInputValue);
            // set latitude, longitude and zoom
            /*
            this.latitude = place.geometry.location.lat();
            this.longitude = place.geometry.location.lng();
            this.zoom = 12;
            */
          });
        });
      });
    }
  }

  listenAddressChanges() {
    this.serviceService.addressChange$
      .pipe(
        tap(addressUpdated => {
          console.log('ADDRESS UPDATED ==> ', addressUpdated);
          this.selectedPlace.name = addressUpdated;
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(address => {
        this.currentAddress = address;
      });
  }

  listenLocationChanges() {
    this.serviceService.locationChange$
      .pipe(
        filter(evt => evt),
        tap(locationUpdated => {
          console.log('LOCATION UPDATED ==> ', locationUpdated);
          this.selectedPlace.location = locationUpdated;
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(location => {
        const latlng = new google.maps.LatLng(
          location.latitude,
          location.longitude
        );
        const circle = new google.maps.Circle({
          center: latlng,
          radius: 20000 // meter
        });
        if (!this.autocomplete) {
          this.buildPlacesAutoComplete();
          setTimeout(() => {
            this.autocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
          }, 500);
        } else {
          this.autocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }
      });
  }

  listenLayoutCommands() {
    this.serviceService.layoutChanges$
      .pipe(
        filter(e => e && e.layout),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(command => {
        if (command && command.layout) {
          if (
            command.layout.type === 0 ||
            command.layout.type === 1 ||
            command.layout.type === 4 ||
            command.layout.type === 5
          ) {
            this.fxFlexTip = 100;
            this.fxFlexFilter = 100;
            this.showHeader = false;
          } else {
            this.fxFlexTip = 40;
            this.fxFlexFilter = 40;
            this.showHeader = true;
          }
        }
      });
  }

  saveFavoritePlace() {
    console.log('saveFavoritePlace', this.selectedPlace);
    this.selectedPlace.favorite = !this.selectedPlace.favorite;
  }
}
