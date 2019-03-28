import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { ServiceService } from '../service.service';
import {
  tap,
  filter,
  map,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  mergeMap,
  toArray
} from 'rxjs/operators';
import { Subject, of, from, interval, merge } from 'rxjs';
import { ServiceState } from '../service-state';
import {
  MatBottomSheetRef,
  MatBottomSheet,
  MatSelectionList,
  MatListOption,
  MatDialog,
  MatSnackBar
} from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';
import { DialogArrivedComponent } from './dialog-arrived/dialog-arrived.component';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent implements OnInit, OnDestroy {
  lat = 3.416652;
  lng = -76.524436;
  zoom = 17;
  render = true;
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
  private ngUnsubscribe = new Subject();
  lastServiceStateReported;
  index = 0;
  numDeltas = 80;
  delay = 10;
  testMarker;
  testMarker2;
  constructor(
    private cdRef: ChangeDetectorRef,
    private serviceService: ServiceService,
    private bottomSheet: MatBottomSheet,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  /* #region ANGULAR NGS */
  ngOnInit() {
    this.listenLayoutCommands();
    this.listenLocationChanges();
    this.center$
      .pipe(
        debounceTime(500),
        filter(val => {
          let toReport = false;
          if (
            this.lastCenterResported &&
            this.lastCenterResported.lat !== (val as any).lat
          ) {
            toReport = true;
          }
          this.lastCenterResported = val;
          return toReport;
        }),
        tap(val => {
          this.serviceService.locationChange$.next({
            latitude: (val as any).lat,
            longitude: (val as any).lng
          });
          /*
          if (this.testMarker2) {
            this.testMarker2.setMap(undefined);
          }
          this.testMarker2 = new google.maps.Marker({
            position: new google.maps.LatLng(
              this.map.getCenter().lat(),
              this.map.getCenter().lng()
            ),
            icon: '../../../assets/icons/location/assigned_user_marker.png',
            map: this.map
          });

          if (this.testMarker) {
            this.testMarker.setMap(undefined);
          }
          this.testMarker = new google.maps.Marker({
            position: new google.maps.LatLng(
              (val as any).lat,
              (val as any).lng
            ),
            icon: '../../../assets/icons/location/vehicle_marker.png',
            map: this.map
          });
*/
        }),
        filter(() => this.nearbyVehiclesEnabled),
        mergeMap(location => {
          return this.getNearbyVehicles$().pipe(
            filter(() => {
              const temp = !this.serviceService.fromAddressLocation;
              this.serviceService.fromAddressLocation = false;
              return temp;
            }),
            tap(() => {
              this.serviceService.addressChange$.next(undefined);
            })
          );
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(val => {});
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /* #endregion */

  /* #region TOOLS */
  currentLocation() {
    if (
      this.map !== undefined &&
      this.currentService &&
      (this.currentService.state === ServiceState.REQUESTED ||
        this.currentService.state === ServiceState.ASSIGNED ||
        this.currentService.state === ServiceState.ARRIVED)
    ) {
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

            this.serviceService.locationChange$.next({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        },
        error => console.log('LLega error: ', error),
        { maximumAge: 60000, timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  initLocation() {
    const service = this.serviceService.currentService$.getValue();
    if (
      this.map !== undefined &&
      service &&
      (service.state === ServiceState.REQUESTED ||
        service.state === ServiceState.ASSIGNED ||
        service.state === ServiceState.ARRIVED)
    ) {
      this.map.setCenter({
        lat: service.pickUp.marker.lat,
        lng: service.pickUp.marker.lng
      });
      this.map.setZoom(17);
    } else if (
      this.map !== undefined &&
      service &&
      service.state === ServiceState.ON_BOARD
    ) {
      this.map.setCenter({
        lat: service.location.lat,
        lng: service.location.lng
      });
      this.map.setZoom(17);
    } else if (navigator.geolocation) {
      if (
        this.map !== undefined &&
        service &&
        this.serviceService.locationChange$.getValue()
      ) {
        this.map.setCenter({
          lat: this.serviceService.locationChange$.getValue().latitude,
          lng: this.serviceService.locationChange$.getValue().longitude
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
              this.serviceService.locationChange$.next({
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
    this.bottomSheet.open(CancelSheet, {closeOnNavigation: true});
  }

  clearMarkerFromMap(listToClear) {
    from(listToClear)
      .pipe()
      .subscribe(res => {});
  }

  changeMarkerPosition(marker, newLat, newLng) {
    const deltaLat = (newLat - marker.getPosition().lat()) / this.numDeltas;
    const deltaLng = (newLng - marker.getPosition().lng()) / this.numDeltas;

    const timeDelay = this.delay * 0.5;
    for (let i = 0; i < this.numDeltas; i++) {
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

  listenLayoutCommands() {
    this.serviceService.layoutChanges$
      .pipe(
        filter(e => e && e.layout),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(command => {
        this.widthMapContent = command.layout.map.width;
        this.heightMapContent = command.layout.map.height;
      });
  }

  mapReady(map) {
    this.map = map;
    this.initLocation();
    this.listenServiceChanges();
    this.startNearbyVehicles();
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

  listenLocationChanges() {
    this.serviceService.locationChange$
      .pipe(
        filter(evt => evt),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(location => {
        console.log('Cambia location: ', location);
        /*
        if (this.map) {
          this.map.setCenter({
            lat: location.latitude,
            lng: location.longitude
          });
          //          this.map.setZoom(17);
        }
        */
      });
  }

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(
        debounceTime(100),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(service => {
        if (service) {
          switch (service.state) {
            case ServiceState.REQUESTED:
              this.refreshCenterMap(service);
              this.disableMap = true;
              this.currentService = service;
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
                  data: {}
                });
              }
              this.nearbyVehiclesEnabled = false;
              this.disableMap = false;
              this.currentService = service;
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
                  console.log(
                    'modifica ubicacion del vehiculo: ',
                    this.currentService.location
                  );
                  this.changeMarkerPosition(
                    this.vehicleMarker,
                    this.currentService.location.lat,
                    this.currentService.location.lng
                  );
                } else {
                  console.log(
                    'agrega ubicacion del vehiculo: ',
                    this.currentService.location
                  );
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
              this.currentService = service;
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
                this.snackBar.open(
                  'Recuerde que tiene 10% de dcto sobre el valor total del servicio',
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
        }
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
        () => {},
        error => {
          // console.error('error buscando vehiculos: ', error);
          this.startNearbyVehicles();
        }
      );
  }

  getNearbyVehicles$() {
    return this.serviceService.getNearbyVehicles().pipe(
      map(result => result.data.NearbyVehicles),
      mergeMap(nearbyVehicles => {
        // Verify if the client have nearbyVehicles and clear all the unnecesary vehicles markers
        if (
          nearbyVehicles === undefined ||
          nearbyVehicles === null ||
          nearbyVehicles.length < 1
        ) {
          return from(this.nearbyVehicleList).pipe(
            tap(v => {
              v.marker.setMap(undefined);
            }),
            toArray(),
            map(() => nearbyVehicles),
            tap(() => {
              this.nearbyVehicleList = [];
            })
          );
        } else {
          return from(nearbyVehicles).pipe(
            tap((vehicle: any) => {
              // find in current vehicleList and refresh the marker position
              const searchElement = this.nearbyVehicleList.find(element => {
                return vehicle.vehicleId === element.vehicleId;
              });

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
            const searchVehicle = nearbyVehicles.find(element => {
              return vehicle.vehicleId === element.vehicleId;
            });
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
          this.nearbyVehicleList = this.nearbyVehicleList.filter(val => {
            return !vehiclesToRemoveList.find(element => {
              return element && val.vehicleId === element.vehicleId;
            });
          });
        }
      })
    );
  }
  /* #endregion */
}

@Component({
  selector: 'app-cancel-sheet',
  templateUrl: 'cancel-sheet.html',
  styleUrls: ['./location.component.scss']
})
export class CancelSheet implements OnInit, OnDestroy {
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
    private bottomSheetRef: MatBottomSheetRef<CancelSheet>,
    private serviceService: ServiceService
  ) {}

  openLink(event: MouseEvent): void {
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }

  onNgModelChange($event) {
    this.serviceService
      .cancelService$($event[0])
      .subscribe(res => console.log('Cancela servicio: ', res));
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }

  ngOnInit(): void {
    console.log('OnInit');
    this.cancelationReasonList.selectedOptions = new SelectionModel<
      MatListOption
    >(false);
    console.log(this.cancelationReasonList);
  }

  ngOnDestroy() {
    console.log('Ondestroy');
    this.bottomSheetRef.dismiss();
  }
}
