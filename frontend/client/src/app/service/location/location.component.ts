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
  MatListOption
} from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent implements OnInit, OnDestroy {
  lat = 51.678418;
  lng = 7.809007;
  zoom = 17;
  render = true;
  widthMapContent = 0;
  heightMapContent = 0;
  center$ = new Subject();
  lastCenterResported;
  showCenterMarker = true;
  currentService;
  userMarker;
  disableMap = false;
  nearbyVehiclesEnabled = true;
  nearbyTimer;
  nearbyVehicleList = [];
  protected map: any;
  private ngUnsubscribe = new Subject();
  constructor(
    private cdRef: ChangeDetectorRef,
    private serviceService: ServiceService,
    private bottomSheet: MatBottomSheet
  ) {}

  /* #region ANGULAR NGS */
  ngOnInit() {
    this.listenLayoutCommands();
    this.listenLocationChanges();
    this.listenServiceChanges();
    this.center$
      .pipe(
        debounceTime(1000),
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
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(val => {
        this.serviceService.locationChange$.next({
          latitude: (val as any).lat,
          longitude: (val as any).lng
        });
      });
    this.getNearbyVehicles();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /* #endregion */

  /* #region TOOLS */
  currentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          if (this.map) {
            this.map.setCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });

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

  openCancelSheet() {
    this.bottomSheet.open(CancelSheet);
  }

  clearMarkerFromMap(listToClear) {
    from(listToClear)
      .pipe()
      .subscribe(res => {});
  }

  changeMarkerPosition(marker, lat, lng) {
    const latlng = new google.maps.LatLng(lat, lng);
    marker.setPosition(latlng);
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
    this.currentLocation();
  }

  onCenterChange($event) {
    this.center$.next($event);
  }

  listenLocationChanges() {
    this.serviceService.locationChange$
      .pipe(
        filter(evt => evt),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(location => {
        if (this.map) {
          this.map.setCenter({
            lat: location.latitude,
            lng: location.longitude,
            zoom: 17
          });
        }
      });
  }

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(service => {
        if (service) {
          switch (service.state) {
            case ServiceState.ARRIVED:
            case ServiceState.ASSIGNED:
            case ServiceState.ON_BOARD:
            case ServiceState.REQUESTED:
              this.nearbyVehiclesEnabled = false;
              this.disableMap = service.state === ServiceState.REQUESTED;
              this.currentService = service;
              if (
                this.currentService &&
                this.currentService.pickup &&
                this.currentService.pickup.location &&
                this.currentService.pickup.marker
              ) {
                this.userMarker = new google.maps.Marker({
                  position: new google.maps.LatLng(
                    this.currentService.pickup.location.marker.lat,
                    this.currentService.pickup.location.marker.lng
                  ),
                  icon:
                    '../../../assets/icons/location/assigned_user_marker.png',
                  map: this.map
                });
              }
              this.showCenterMarker = false;
              break;
            default:
              this.disableMap = false;
              this.currentService = undefined;
              this.showCenterMarker = true;
              this.nearbyVehiclesEnabled = true;
              break;
          }
        }
      });
  }
  /* #endregion */

  /* #region QUERIES */
  getNearbyVehicles() {
    interval(3000)
      .pipe(
        filter(() => this.nearbyVehiclesEnabled),
        mergeMap(() => {
          return this.serviceService.getNearbyVehicles().pipe(
            map(result => result.data.NearbyVehicles),
            mergeMap(nearbyVehicles => {
              // Verify if the client have nearbyVehicles and clear all the unnecesary vehicles markers
              if (nearbyVehicles === undefined || nearbyVehicles.length < 1) {
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
                    const searchElement = this.nearbyVehicleList.find(
                      element => {
                        return vehicle.vehicleId === element.vehicleId;
                      }
                    );

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
                  })
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
            })
          );
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(
        vehiclesToRemoveList => {
          this.nearbyVehicleList = this.nearbyVehicleList.filter(val => {
            return !vehiclesToRemoveList.find(element => {
              return val.vehicleId === element.vehicleId;
            });
          });
          console.log('Lista al final: ', this.nearbyVehicleList);
        },
        error => {
          this.getNearbyVehicles();
        }
      );
  }
  /* #endregion */
}

@Component({
  selector: 'app-cancel-sheet',
  templateUrl: 'cancel-sheet.html',
  styleUrls: ['./location.component.scss']
})
export class CancelSheet implements OnInit {
  @ViewChild(MatSelectionList) cancelationReasonList: MatSelectionList;

  selectedOption;
  cancelReasonList = [
    {
      text: 'Placa no corresponde',
      value: 'PlATE_DOESNT_MATCH'
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
    this.serviceService.currentService$.next({
      state: ServiceState.NO_SERVICE
    });
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }

  ngOnInit(): void {
    this.cancelationReasonList.selectedOptions = new SelectionModel<
      MatListOption
    >(false);
    console.log(this.cancelationReasonList);
  }
}
