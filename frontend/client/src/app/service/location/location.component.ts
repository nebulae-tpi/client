import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  NgZone
} from '@angular/core';
import { ServiceService } from '../service.service';
import {
  tap,
  filter,
  map,
  takeUntil,
  debounceTime,
  mergeMap,
  toArray
} from 'rxjs/operators';
import { Subject, from, interval } from 'rxjs';
import { ServiceState } from '../service-state';
import {
  MatBottomSheetRef,
  MatBottomSheet,
  MatSelectionList,
  MatDialog,
  MatSnackBar
} from '@angular/material';
import { DialogArrivedComponent } from './dialog-arrived/dialog-arrived.component';
import { MapsAPILoader } from '@agm/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-cancel-sheet',
  templateUrl: 'cancel-sheet.html',
  styleUrls: ['./location.component.scss']
})
export class CancelSheetComponent implements OnInit, OnDestroy {
  @ViewChild(MatSelectionList) cancelationReasonList: MatSelectionList;

  selectedOption;
  cancelReasonList = [
    {
      text: 'Placa no corresponde',
      value: 'PLATE_DOESNT_MATCH'
    },
    {
      text: 'No es el conductor',
      value: 'IS_NOT_THE_DRIVER'
    },
    {
      text: 'Se demora mucho',
      value: 'IT_TAKES_TOO_MUCH_TIME'
    },
    {
      text: 'Ya no se requiere',
      value: 'DOESNT_REQUIRED'
    }
  ];
  constructor(
    private bottomSheetRef: MatBottomSheetRef<CancelSheetComponent>,
    private serviceService: ServiceService
  ) { }

  openLink(event: MouseEvent): void {
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }

  onNgModelChange($event) {
    this.serviceService.cancelService$($event)
      .subscribe(res => console.log('Cancela servicio: ', res));
    this.bottomSheetRef.dismiss();
    console.log({ $event });
    // event.preventDefault();
  }

  ngOnInit(): void {
    console.log('OnInit');
  }

  ngOnDestroy() {
    console.log('Ondestroy');
    this.bottomSheetRef.dismiss();
  }
}

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent implements OnInit, OnDestroy {

  STRINGS_TO_REMOVE = [', Antioquia', ', Valle del Cauca', ', Colombia'];

  showDestinationPlaceInput = false;
  @ViewChild('destinationPlaceSearch') destinationPlaceSearchElementRef: ElementRef;
  destinationPlace: any = {};
  destinationPlaceAutocomplete: any;
  destinationPlaceAddresInput = new FormControl();


  lat = 3.416652; // todo
  lng = -76.524436; // todo
  zoom = 17;
  // render = true;
  widthMapContent = 0;
  heightMapContent = 0;

  center$ = new Subject();
  lastCenterResported;
  showCenterMarker = true;
  currentService;
  userMarker;
  vehicleMarker;
  disableMap = false;
  nearbyVehiclesEnabled = true;
  nearbyTimer;
  nearbyVehicleList = [];
  protected map: any;

  lastServiceStateReported;
  index = 0;
  NUM_DELTAS = 80;
  DELAY = 10;



  layoutType = null;

  private ngUnsubscribe = new Subject();


  // TESTING VARS
  public origin: any; // new google.maps.LatLng(6.1610224, -75.605014);
  public destination: any; // = new google.maps.LatLng(6.1731996, -75.6079489);

  // TESTING VARS


  constructor(
    private cdRef: ChangeDetectorRef,
    private serviceService: ServiceService,
    private bottomSheet: MatBottomSheet,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone
  ) {
  }

  /* #region ANGULAR NGS */
  ngOnInit() {
    this.listenLayoutCommands();
    this.listenMarkerPosition();
    this.listenOnResume();
    this.listenCenterChanges();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  consoleLog(event) {
    console.log('####### ==> ', event);
  }

  buildDestinationPlaceAutoComplete(circle?) {
    if (!this.destinationPlaceSearchElementRef) {
      setTimeout(() => {
        console.log('INTENTANDO A CONSTRUIR EL AUTOCIOMPLETE ..............');
        if(this.showDestinationPlaceInput){
          this.buildDestinationPlaceAutoComplete(circle);
        }        
      }, 200);
      return;
    }
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

          this.serviceService.publishServiceChanges({ state: ServiceState.REQUEST });


        });
      });

      if (circle) {
        this.destinationPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
      }
    });

  }

  publishDestinationPlaceSelected(){
    console.log(this.serviceService.destinationPlaceSelected$);
  }

  listenCenterChanges() {
    this.center$
      .pipe(
        debounceTime(500),
        filter(val => {

          let toReport = false;
          if (this.lastCenterResported && this.lastCenterResported.lat !== (val as any).lat) {
            toReport = true;
          }

          this.lastCenterResported = val;
          return toReport;
        }),
        tap(val => {
          this.serviceService.markerOnMapChange$.next({
            latitude: (val as any).lat,
            longitude: (val as any).lng
          });

        }),
        filter(() => this.nearbyVehiclesEnabled),
        mergeMap(location => {
          // todo - what for is fromAddressLocation variable??
          return this.getNearbyVehicles$().pipe(
            // filter(() => {
            //   const temp = !this.serviceService.fromAddressLocation;
            //   this.serviceService.fromAddressLocation = false;
            //   return temp;
            // }),
            // tap(() => {
            //   this.serviceService.addressChange$.next(undefined);
            // })
          );
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(val => { });
  }


  /* #endregion */

  /* #region TOOLS */
  currentLocation() {

    const availableStates = [ServiceState.REQUESTED, ServiceState.ASSIGNED, ServiceState.ARRIVED ];

    if ( this.map !== undefined && this.currentService && availableStates.includes(this.currentService.state)) {
      this.map.setCenter({
        lat: this.currentService.pickUp.marker.lat,
        lng: this.currentService.pickUp.marker.lng
      });
      this.map.setZoom(17);
    } else if (
      this.map !== undefined &&
      this.currentService &&
      this.currentService.state === ServiceState.ON_BOARD
    ) {
      this.map.setCenter({
        lat: this.currentService.location.lat,
        lng: this.currentService.location.lng
      });
      this.map.setZoom(17);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          if (this.map) {
            this.map.setCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            this.map.setZoom(17);

            this.serviceService.markerOnMapChange$.next({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });

          }
        },
        error => console.log('getCurrentPosition error: ', error),
        { maximumAge: 60000, timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  /**
   * 
   */
  initLocation() {
    this.currentService = this.serviceService.currentService$.getValue();
    const markerOnMap = this.serviceService.markerOnMapChange$.getValue();

    const { state, pickUp, location  } = this.currentService;

    const allowedServiceStates = [ServiceState.REQUESTED, ServiceState.ASSIGNED, ServiceState.ARRIVED];

    if (this.map !== undefined && this.currentService && (allowedServiceStates.includes(state))) {
      this.map.setCenter({
        lat: pickUp.marker.lat,
        lng: pickUp.marker.lng
      });
      this.map.setZoom(17);
    } else if (this.map !== undefined && this.currentService && state === ServiceState.ON_BOARD) {
      this.map.setCenter({
        lat: location.lat,
        lng: location.lng
      });
      this.map.setZoom(17);
    } else if (navigator.geolocation) {
      if (this.map !== undefined && this.currentService && markerOnMap) {
        this.map.setCenter({
          lat: markerOnMap.latitude,
          lng: markerOnMap.longitude
        });
        this.map.setZoom(17);
      } else {
        navigator.geolocation.getCurrentPosition(
          position => {
            if (this.map) {
              this.map.setCenter({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              this.map.setZoom(17);
              this.serviceService.markerOnMapChange$.next({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            }
          },
          error => console.log('LLega error: ', error),
          { maximumAge: 60000, timeout: 5000, enableHighAccuracy: true }
        );
      }
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  openCancelSheet() {
    this.bottomSheet.open(CancelSheetComponent, { closeOnNavigation: true });
  }

  clearMarkerFromMap(listToClear) {
    from(listToClear)
      .pipe()
      .subscribe(res => { });
  }

  changeMarkerPosition(marker, newLat, newLng) {
    const deltaLat = (newLat - marker.getPosition().lat()) / this.NUM_DELTAS;
    const deltaLng = (newLng - marker.getPosition().lng()) / this.NUM_DELTAS;

    const timeDelay = this.DELAY * 0.5;
    for (let i = 0; i < this.NUM_DELTAS; i++) {
      setTimeout(() => {
        let lat = marker.position.lat();
        let lng = marker.position.lng();
        lat += deltaLat;
        lng += deltaLng;
        const latlng = new google.maps.LatLng(lat, lng);
        marker.setPosition(latlng);
      }, timeDelay * i);
    }
  }
  addNearbyVehicle(vehicleMarker) {
    this.nearbyVehicleList.push({
      vehicleId: vehicleMarker.vehicleId,
      marker: new google.maps.Marker({
        position: new google.maps.LatLng(
          vehicleMarker.point.lat,
          vehicleMarker.point.lng
        ),
        icon: '../../../assets/icons/location/vehicle_marker.png',
        map: this.map
      })
    });
  }
  /* #endregion */

  /* #region LISTENERS */

  /**
   * Listen Layouts to update width and height map
   */
  listenLayoutCommands() {
    this.serviceService.layoutChanges$
      .pipe(
        filter(e => e && e.layout),
        map(e => e.layout),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(layout => {
        this.widthMapContent = layout.map.width;
        this.heightMapContent = layout.map.height;
        this.layoutType = layout.type;

        if (layout.type !== ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT) {
          this.showDestinationPlaceInput = false;
        }

      });
  }

  /**
   * todo what is it ? when onResume is emmited ? ...
   */
  listenOnResume() {
    this.serviceService.onResume$.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.currentLocation();
    });
  }

  mapReady(mapRef) {
    // todo origin and destination to test
    this.origin = new google.maps.LatLng(6.1610224, -75.605014);
    this.destination = new google.maps.LatLng(6.1731996, -75.6079489);


    this.map = mapRef;
    this.initLocation();
    this.listenServiceChanges();
    this.startNearbyVehicles();
    if (this.currentService && this.currentService.state === ServiceState.NO_SERVICE && this.showDestinationPlaceInput) {
      // setTimeout(() => {
        this.buildDestinationPlaceAutoComplete();
      // }, 1000);
    }
  }

  onCenterChange($event) {
    this.center$.next($event);
  }

  refreshCenterMap(service) {
    if (this.lastServiceStateReported !== service.state) {
      setTimeout(() => {
        this.currentLocation();
      }, 1000);
    }
  }

  /**
   * Updates the map center
   */
  listenMarkerPosition() {
    this.serviceService.markerOnMapChange$
      .pipe(
        filter(evt => evt),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(location => {
        if (this.map) {
          this.map.setCenter({
            lat: location.latitude,
            lng: location.longitude
          });

        }
        const latlng = new google.maps.LatLng(
          location.latitude,
          location.longitude
        );
        const circle = new google.maps.Circle({
          center: latlng,
          radius: 20000 // meters
        });

        if (!this.destinationPlaceAutocomplete) {
          this.buildDestinationPlaceAutoComplete(circle);
        } else if(this.showDestinationPlaceInput) {
          console.log('PONIENDO  OPCIONES ADICIONALES A EL AUTOCOMPLETE DE DESTINO EN EL MAPA');          
          this.destinationPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }

      });
  }

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(
        filter(service => service),
        debounceTime(100),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(service => {
        this.currentService = service;

        switch (service.state) {
          case ServiceState.NO_SERVICE:
            if (this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT) {
              this.showDestinationPlaceInput = true;
            }
            break;
          case ServiceState.CANCELLED_CLIENT:
            break;
          case ServiceState.CANCELLED_DRIVER:
            break;
          case ServiceState.CANCELLED_OPERATOR:
            break;
          case ServiceState.CANCELLED_SYSTEM:
            break;
          case ServiceState.DONE:
            this.showDestinationPlaceInput = true;
            break;
          case ServiceState.REQUESTED:
            this.showDestinationPlaceInput = false;
            this.refreshCenterMap(service);
            this.disableMap = true;
            if (
              this.currentService &&
              this.currentService.pickUp &&
              this.currentService.pickUp &&
              this.currentService.pickUp.marker
            ) {
              this.userMarker = new google.maps.Marker({
                position: new google.maps.LatLng(
                  this.currentService.pickUp.marker.lat,
                  this.currentService.pickUp.marker.lng
                ),
                icon:
                  '../../../assets/icons/location/assigned_user_marker.png',
                map: this.map
              });
            }
            this.showCenterMarker = false;
            break;
          case ServiceState.ARRIVED:

          case ServiceState.ASSIGNED:
            this.refreshCenterMap(service);
            if (
              service.state === ServiceState.ARRIVED &&
              this.lastServiceStateReported !== service.state
            ) {
              this.dialog.closeAll();
              this.dialog.open(DialogArrivedComponent, {
                width: '250px',
                panelClass: 'my-panel',
                data: {}
              });
            }
            this.nearbyVehiclesEnabled = false;
            this.disableMap = false;
            this.nearbyVehicleList.forEach(vehicle => {
              vehicle.marker.setMap(undefined);
            });
            this.nearbyVehicleList = [];
            if (
              this.currentService &&
              this.currentService.pickUp &&
              this.currentService.pickUp &&
              this.currentService.pickUp.marker
            ) {
              if (this.userMarker) {
                this.changeMarkerPosition(
                  this.userMarker,
                  this.currentService.pickUp.marker.lat,
                  this.currentService.pickUp.marker.lng
                );
              } else {
                this.userMarker = new google.maps.Marker({
                  position: new google.maps.LatLng(
                    this.currentService.pickUp.marker.lat,
                    this.currentService.pickUp.marker.lng
                  ),
                  icon:
                    '../../../assets/icons/location/assigned_user_marker.png',
                  map: this.map
                });
              }
            }

            if (this.currentService && this.currentService.location) {
              if (this.vehicleMarker) {
                this.changeMarkerPosition(
                  this.vehicleMarker,
                  this.currentService.location.lat,
                  this.currentService.location.lng
                );
              } else {
                console.log('agrega ubicacion del vehiculo: ', this.currentService.location);
                this.vehicleMarker = new google.maps.Marker({
                  position: new google.maps.LatLng(
                    this.currentService.location.lat,
                    this.currentService.location.lng
                  ),
                  icon: '../../../assets/icons/location/vehicle_marker.png',
                  map: this.map
                });
              }
            }
            this.showCenterMarker = false;
            break;
          case ServiceState.ON_BOARD:
            this.refreshCenterMap(service);
            this.nearbyVehiclesEnabled = false;
            this.disableMap = false;
            this.nearbyVehicleList.forEach(vehicle => {
              vehicle.marker.setMap(undefined);
            });
            this.nearbyVehicleList = [];

            if (this.userMarker) {
              this.userMarker.setMap(undefined);
              this.userMarker = undefined;
            }
            if (this.currentService && this.currentService.location) {
              if (this.vehicleMarker) {
                this.changeMarkerPosition(
                  this.vehicleMarker,
                  this.currentService.location.lat,
                  this.currentService.location.lng
                );
              } else {
                this.vehicleMarker = new google.maps.Marker({
                  position: new google.maps.LatLng(
                    this.currentService.location.lat,
                    this.currentService.location.lng
                  ),
                  icon: '../../../assets/icons/location/vehicle_marker.png',
                  map: this.map
                });
              }
            }
            this.showCenterMarker = false;
            if (this.lastServiceStateReported !== service.state) {
              // TODO read farediscount
              this.snackBar.open(
                'Recuerde que tiene 15% de dcto sobre el valor total del servicio',
                'Cerrar',
                {
                  duration: 10000
                }
              );
            }
            break;
          default:
            if (this.vehicleMarker) {
              this.vehicleMarker.setMap(undefined);
              this.vehicleMarker = undefined;
            }
            if (this.userMarker) {
              this.userMarker.setMap(undefined);
              this.userMarker = undefined;
            }

            this.disableMap = false;
            this.currentService = undefined;
            this.showCenterMarker = true;
            this.nearbyVehiclesEnabled = true;
            break;
        }

        this.lastServiceStateReported = service.state;

      });
  }




  /* #endregion */

  /* #region QUERIES */
  startNearbyVehicles() {
    interval(5000)
      .pipe(
        filter(() => this.nearbyVehiclesEnabled),
        mergeMap(() => {
          return this.getNearbyVehicles$();
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(
        () => { },
        error => {
          // console.error('error buscando vehiculos: ', error);
          this.startNearbyVehicles();
        }
      );
  }

  /**
   * get near vehicles ans paint it in map
   */
  getNearbyVehicles$() {
    return this.serviceService.getNearbyVehicles().pipe(
      map(result => ((result || {}).data || {}).NearbyVehicles),
      mergeMap(nearbyVehicles => {
        // Verify if the client have nearbyVehicles and clear all the unnecesary vehicles markers
        if (
          nearbyVehicles === undefined ||
          nearbyVehicles === null ||
          nearbyVehicles.length < 1
        ) {
          return from(this.nearbyVehicleList).pipe(
            tap(v => v.marker.setMap(undefined)),
            toArray(),
            map(() => nearbyVehicles),
            tap(() => this.nearbyVehicleList = [])
          );
        } else {
          return from(nearbyVehicles).pipe(
            tap((vehicle: any) => {
              // find in current vehicleList and refresh the marker position
              const searchElement = this.nearbyVehicleList.find(element => vehicle.vehicleId === element.vehicleId);

              if (searchElement) {
                this.changeMarkerPosition(
                  searchElement.marker,
                  vehicle.point.lat,
                  vehicle.point.lng
                );
              } else {
                // add the missing vehicles
                this.addNearbyVehicle(vehicle);
              }
            }),
            toArray()
            // map(nearbyVehicles)
          );
        }
      }),
      // Get the items to remove
      mergeMap((nearbyVehicles: any) => {
        return from(this.nearbyVehicleList).pipe(
          map(vehicle => {
            const searchVehicle = nearbyVehicles.find(element => vehicle.vehicleId === element.vehicleId);

            if (!searchVehicle) {
              vehicle.marker.setMap(undefined);
            }
            return searchVehicle ? undefined : vehicle;
          }),
          toArray()
        );
      }),
      tap(vehiclesToRemoveList => {

        if (vehiclesToRemoveList) {
          this.nearbyVehicleList = this.nearbyVehicleList.filter(val =>
            !vehiclesToRemoveList.find(element => element && val.vehicleId === element.vehicleId)
          );
        }

      })
    );
  }
  /* #endregion */
}
