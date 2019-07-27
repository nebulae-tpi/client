import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
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
  toArray,
  delay,
  startWith,
} from 'rxjs/operators';
import { Subject, from, interval, merge, of, combineLatest, defer, Observable, forkJoin } from 'rxjs';
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
import { ORIGIN_DESTINATION_MATRIX_FARE } from '../specialFarePlaces/originDestinationMatrix';
import { PLACES_WITH_SPECIAL_FARE } from '../specialFarePlaces/places';

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
    // console.log({ $event });
    // event.preventDefault();
  }

  ngOnInit(): void {
    console.log('OnInit');
  }

  ngOnDestroy() {
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
  lastCenterReported: any;
  showCenterMarker = true;
  currentService;

  originMarker: google.maps.Marker;
  originMarkerInfoWindow: google.maps.InfoWindow;

  destinationMarker: google.maps.Marker;
  destinationMarkerInfoWindow: google.maps.InfoWindow;

  placeToMoveWithCenter: string = null;
  estimatedTripCost: any = null;
  minTripCost = 5600; // toddo

  vehicleMarker;
  disableMap = false;
  nearbyVehiclesEnabled = true;
  nearbyTimer;
  nearbyVehicleList = [];
  protected map: google.maps.Map;

  lastServiceStateReported;
  index = 0;
  NUM_DELTAS = 80;
  DELAY = 10;



  layoutType = null;

  private ngUnsubscribe = new Subject();


  // direction display Element
  directionsDisplay: google.maps.DirectionsRenderer;
  directionsService: google.maps.DirectionsService;

  originPlace: any;


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



    this.listenOriginDestinationPlaceChanges();

    this.listenServiceCommands();

  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  listenOriginDestinationPlaceChanges() {
    combineLatest(
      this.serviceService.originPlaceSelected$,
      this.serviceService.destinationPlaceSelected$
    )
      .pipe(
        map(([origin, destination]) => ({
          origin, destination,
          twoConfirmed: (origin || {}).confirmed && (destination || {}).confirmed
        })),
        tap((places: any) => {

          if (this.directionsDisplay) {
            this.directionsDisplay.setMap(null);
            this.estimatedTripCost = null;
          }

          // https://icons8.com/icon/set/map-marker/material
          if (places.destination) {
            console.log('REMOVE THE MARKER ON CENTER MAP');
            this.showCenterMarker = false;
            this.placeToMoveWithCenter = null;

            if (this.destinationMarker) {
              this.destinationMarker.setPosition({
                lat: places.destination.location.lat,
                lng: places.destination.location.lng
              });
            } else {
              this.destinationMarker = new google.maps.Marker({
                position: {
                  lat: places.destination.location.lat,
                  lng: places.destination.location.lng
                },
                icon: '../../../assets/icons/location/destination-place-30.png',
                map: this.map
              });
            }



          }
          if (places.origin && !this.showCenterMarker) {
            if (!this.originMarker) {
              this.originMarker = new google.maps.Marker({
                position: new google.maps.LatLng(
                  places.origin.location.lat,
                  places.origin.location.lng,
                ),
                icon: '../../../assets/icons/location/origin-place-30.png',
                // icon: '../../../assets/icons/location/drag-pin-30.png',
                map: this.map,
                clickable: true
              });

              const buttonString = 'Fijar Con Puntero';
              this.originMarkerInfoWindow = new google.maps.InfoWindow({
                content: `
                <div id="origin-marker-info-window">
                  <div id="bodyContent">
                  <p><b>${places.origin.name}</b></p>
                  <div id="use-pointer-btn" class="use-pointer-btn">${buttonString}</div>
                </div>`
              });

              this.originMarker.addListener('click', () => {
                this.originMarkerInfoWindow.open(this.map, this.originMarker);
                setTimeout(() => {
                  document.getElementById('use-pointer-btn')
                    .addEventListener('mousedown', () => this.onUsePointerToSetLocation('ORIGIN'));
                }, 200);

              });

              // node



            } else {

              this.originMarker.setPosition({
                lat: places.origin.location.lat,
                lng: places.origin.location.lng
              });

            }


          }


          // UPDATE THE ZOOM AND CENTER TO SHOW DESTINATION AND ORIGINMARKER ON MAP

          let bounds;
          if (this.originMarker) {
            bounds = new google.maps.LatLngBounds();
            bounds.extend(this.originMarker.getPosition());
          }
          if (bounds && this.destinationMarker) {
            bounds.extend(this.destinationMarker.getPosition());
          }

          if (this.map && bounds) {
            // todo padding is not working
            this.map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
            // this.map.setZoom(this.map.getZoom());

            // this.map.setCenter(bounds);
          }



        }),
        filter(places => places.origin && places.destination),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(places => {
        this.originPlace = places.origin;
        this.destinationPlace = places.destination;







      });
  }

  listenServiceCommands() {
    this.serviceService.serviceCommands$
      .pipe(
        filter(command => command && command.code),
      ).subscribe(command => {
        switch (command.code) {
          case ServiceService.COMMAND_ON_CONFIRM_BTN:

            console.log('CONFIRMAR LAS UBICACIONES DE LOSMARCADORES');

            this.originPlace = {
              ...this.originPlace,
              location: {
                lat: this.originMarker.getPosition().lat(),
                lng: this.originMarker.getPosition().lng()
              }
            };

            this.originMarkerInfoWindow = new google.maps.InfoWindow({
              content: `
            <div id="origin-marker-info-window">
              <div id="bodyContent">
              <p><b>${this.originPlace.name}</b></p>
            </div>`
            });

            this.destinationMarkerInfoWindow = new google.maps.InfoWindow({
              content: `
            <div id="destination-marker-info-window">
              <div id="bodyContent">
              <p><b>${this.originPlace.name}</b></p>
            </div>`
            });

            this.serviceService.originPlaceSelected$.next(this.originPlace);

            this.calculateRoute();


            break;

          default:
            break;
        }
      });
  }

  onUsePointerToSetLocation(e: string) {
    console.log(e);

    switch (e) {
      case 'ORIGIN':
        this.originMarkerInfoWindow.close();
        const newCenter = new google.maps.LatLng(this.originPlace.location.lat, this.originPlace.location.lng);
        this.map.setCenter(newCenter);
        const newMapZoom = this.map.getZoom() + 2;
        // tslint:disable-next-line: no-unused-expression
        newMapZoom < 19 ? this.map.setZoom(newMapZoom) : {};
        this.placeToMoveWithCenter = e;
        // this.originMarker.setOptions({
        //   position: this.originMarker.getPosition(),
        //   visible: false
        // });

        break;

      default:
        break;
    }

  }

  confirmLocationCoords(placeType: string) {
    console.log('CONFIRMANDO EL PUNTERO DE ', placeType);

    switch (placeType) {
      case 'ORIGIN':
        this.placeToMoveWithCenter = null;
        break;

      default:
        break;
    }


  }




  onDirectionResponse(event) {
    console.log(' onDirectionResponse ==> ', event);
  }

  reportAgmStatus(event) {
    console.log(' reportAgmStatus ==> ', event);
  }

  buildDestinationPlaceAutoComplete(circle?) {
    if (!this.destinationPlaceSearchElementRef) {
      setTimeout(() => {
        console.log('INTENTANDO A CONSTRUIR EL AUTOCIOMPLETE ..............');
        if (this.showDestinationPlaceInput) {
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

          // console.log('OLD NAME IS ==> ', destinationPlaceName);
          this.STRINGS_TO_REMOVE.forEach(s => destinationPlaceName = destinationPlaceName.replace(s, ''));

          // console.log('NEW NAME IS ==> ', destinationPlaceName);

          this.destinationPlace.name = destinationPlaceName;
          this.destinationPlaceAddresInput.setValue(destinationPlaceName);

          this.serviceService.publishServiceChanges({ state: ServiceState.REQUEST });

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

      if (circle) {
        // this.destinationPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
      }
    });
  }


  listenCenterChanges() {
    this.center$
      .pipe(
        tap(R => console.log('listenCenterChanges ==> ', R)),
        filter((center: any) => {
          const isDifferentLocation = this.lastCenterReported && this.lastCenterReported.lat !== center.lat;
          this.lastCenterReported = center;
          return isDifferentLocation;
        }),
        tap((center: any) => {
          console.log('NUEVO CENTER ===> ', center);
          if (this.placeToMoveWithCenter === 'ORIGIN') {
            this.originMarker.setPosition({ lat: center.lat, lng: center.lng });
            this.serviceService.originPlaceSelected$.next({
              ...this.originPlace,
              location: { lat: center.lat, lng: center.lng }
            });
          }




        }),
        debounceTime(500),

        tap((val: any) => {
          this.serviceService.markerOnMapChange$.next({
            latitude: val.lat,
            longitude: val.lng
          });

          if (this.originMarker && this.placeToMoveWithCenter === 'ORIGIN') {
            this.originMarker.setPosition({ lat: val.lat, lng: val.lng });
          }
          if (this.destinationMarker && this.placeToMoveWithCenter === 'DESTINATION') {
            this.destinationMarker.setPosition({ lat: val.lat, lng: val.lng });
          }

        }


        ),
        filter(() => this.nearbyVehiclesEnabled),
        mergeMap(() => this.getNearbyVehicles$()),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(val => { });
  }


  /* #endregion */

  /* #region TOOLS */
  currentLocation() {

    const availableStates = [ServiceState.REQUESTED, ServiceState.ASSIGNED, ServiceState.ARRIVED];

    if (this.map !== undefined && this.currentService && availableStates.includes(this.currentService.state)) {
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


  initLocation() {
    this.currentService = this.serviceService.currentService$.getValue();
    const markerOnMap = this.serviceService.markerOnMapChange$.getValue();

    console.log('init location marker on map ==> ', markerOnMap);


    const { state, pickUp, location } = this.currentService;

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

              this.updateFirstOriginPlace(position.coords.latitude, position.coords.longitude);
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
        tap(R => console.log(R)),
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
      tap(R => console.log(R)),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.currentLocation();
    });
  }

  mapReady(mapRef) {
    // todo origin and destination to test

    this.map = mapRef;

    this.initLocation();
    this.listenServiceChanges();
    this.startNearbyVehicles();
    if (this.currentService && this.currentService.state === ServiceState.NO_SERVICE && this.showDestinationPlaceInput) {
      // setTimeout(() => {
      this.buildDestinationPlaceAutoComplete();
      // }, 1000);
    }

    const markerOnMap = this.serviceService.markerOnMapChange$.getValue();

  }


  searchAdditionalTripFare$(estimatedTripValue, originLatLng, destinationLatLng){
    console.log({estimatedTripValue});

    // recardo de noche 700

    return forkJoin(
      of(PLACES_WITH_SPECIAL_FARE
        .filter(place => this.serviceService.isPointInPolygon({lat: originLatLng.lat, lng: originLatLng.lng }, place.points))
        [0]
      ),
      of(PLACES_WITH_SPECIAL_FARE
        .filter(place => this.serviceService.isPointInPolygon({lat: destinationLatLng.lat, lng: destinationLatLng.lng }, place.points))
        [0]
      ),
    )
    .pipe(
      map(([specialOrigin, specialDestination]) => (specialOrigin && specialDestination)
        ? ORIGIN_DESTINATION_MATRIX_FARE
        .find(item => (specialOrigin.name === item.from && specialDestination.name === item.to ))
        : of(null)
      ),
      map((additionalFare: any) => !additionalFare ? estimatedTripValue : {
        ...estimatedTripValue,
        cost: additionalFare.fare
      }),
      tap((estimatedResult) =>  this.estimatedTripCost = estimatedResult )
    );


  }

  calculateRoute() {

    const originLatLng = new google.maps.LatLng(this.originPlace.location.lat, this.originPlace.location.lng);
    const destinationLatLng = new google.maps.LatLng(this.destinationPlace.location.lat, this.destinationPlace.location.lng);


    this.directionsDisplay = this.directionsDisplay || new google.maps.DirectionsRenderer();
    this.directionsService = this.directionsService || new google.maps.DirectionsService();

    this.directionsDisplay.setMap(this.map);

    Observable.create(observer => {

      let tripDuration = 0; // minutes
      let tripDistance = 0; // Meters

      const queryArgs: google.maps.DirectionsRequest = {
        origin: originLatLng,
        destination: destinationLatLng,
        travelMode: google.maps.TravelMode.DRIVING
      };

      this.directionsService.route(queryArgs, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK) {

          this.directionsDisplay.setOptions({
            polylineOptions: {
              strokeColor: '#3B4045',
              strokeWeight: 6
            },
            suppressMarkers: true,
            directions: response
          });

          response.routes[0].legs.forEach(leg => {
            tripDistance += leg.distance.value;
            tripDuration += leg.duration.value;
          });
          observer.next({ duration: tripDuration, distance: Math.floor((tripDistance / 1000) * 100) / 100 + ' Km', cost: 0  });


        } else {
          console.log('ERROR AL HACER EL CALCULO DE LA RUTA', status);
          observer.next(null);
        }
        observer.complete();

      });


    }).pipe(
      mergeMap(estimatedResult => this.searchAdditionalTripFare$(estimatedResult, originLatLng, destinationLatLng)),
      filter((response: any) => response),
      mergeMap(result => this.serviceService.getPricePerKilometerOnTrip$()),
      map((result: any) => ((result || {}).data || {}).pricePerKilometerOnTrip || 1410),
      // filter((result: any) => result)

    ).subscribe(valuePerKilometer => {
      console.log('################### ===> ', valuePerKilometer);

      let cost = (Math.ceil( parseFloat(this.estimatedTripCost.distance) * valuePerKilometer) +
        50 - (Math.ceil(parseFloat(this.estimatedTripCost.distance) * valuePerKilometer) % 50));

      if (cost < this.minTripCost) {
        cost = this.minTripCost;
        console.log('VALOR DE LA CARRERA MINIMA');
      }

      const formatter = new Intl.NumberFormat('co-COP', {
        style: 'currency',
        currency: 'USD',
      });

      const priceFormated = formatter.format(cost +  this.estimatedTripCost.cost);
      this.estimatedTripCost.cost = priceFormated.substring(0, priceFormated.length - 3);



    }


    );




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
        tap(R => console.log(R)),
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
        } else if (this.showDestinationPlaceInput) {
          // this.destinationPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
        }

      });
  }

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(
        tap(R => console.log(R)),
        filter(service => service),
        debounceTime(100),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(service => {
        this.currentService = service;
        const { state, pickUp, location } = this.currentService;

        switch (state) {
          case ServiceState.NO_SERVICE:
            if (this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT) {
              this.showDestinationPlaceInput = true;
            }
            this.showCenterMarker = true;
            if (this.destinationMarker) {
              this.destinationMarker.setMap(null);
              this.destinationMarker = null;
            }

            if (this.originMarker) {
              this.originMarker.setMap(null);
              this.originMarker = null;
            }


            break;
          case ServiceState.CANCELLED_CLIENT:
            this.showDestinationPlaceInput = true;
            break;
          case ServiceState.CANCELLED_DRIVER:
            this.showDestinationPlaceInput = true;
            break;
          case ServiceState.CANCELLED_OPERATOR:
            this.showDestinationPlaceInput = true;
            break;
          case ServiceState.CANCELLED_SYSTEM:
            this.showDestinationPlaceInput = true;
            break;
          case ServiceState.DONE:
            this.showDestinationPlaceInput = true;
            break;
          case ServiceState.REQUEST:
            this.showDestinationPlaceInput = false;
            console.log(' CHANGED TO == ServiceState.REQUEST ==>', this.originMarker, this.originPlace);
            break;
          case ServiceState.REQUESTED:
            this.showDestinationPlaceInput = false;
            this.refreshCenterMap(this.currentService);
            this.disableMap = true;
            if (this.currentService && pickUp && pickUp.marker) {
              this.originMarker = new google.maps.Marker({
                position: new google.maps.LatLng(
                  pickUp.marker.lat,
                  pickUp.marker.lng
                ),
                icon:
                  '../../../assets/icons/location/assigned_user_marker.png',
                map: this.map
              });
            }
            this.showCenterMarker = false;
            break;
          case ServiceState.ARRIVED:
            this.showDestinationPlaceInput = true;
            break;
          case ServiceState.ASSIGNED:
            this.showDestinationPlaceInput = false;
            this.refreshCenterMap(this.currentService);
            if (state === ServiceState.ARRIVED &&
              this.lastServiceStateReported !== state
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
            if (this.currentService && pickUp && pickUp.marker) {
              if (this.originMarker) {
                this.changeMarkerPosition(
                  this.originMarker,
                  pickUp.marker.lat,
                  pickUp.marker.lng
                );
              } else {
                this.originMarker = new google.maps.Marker({
                  position: new google.maps.LatLng(
                    pickUp.marker.lat,
                    pickUp.marker.lng
                  ),
                  icon:
                    '../../../assets/icons/location/assigned_user_marker.png',
                  map: this.map
                });
              }
            }

            if (this.currentService && location) {
              if (this.vehicleMarker) {
                this.changeMarkerPosition(
                  this.vehicleMarker,
                  location.lat,
                  location.lng
                );
              } else {
                console.log('agrega ubicacion del vehiculo: ', location);
                this.vehicleMarker = new google.maps.Marker({
                  position: new google.maps.LatLng(
                    location.lat,
                    location.lng
                  ),
                  icon: '../../../assets/icons/location/vehicle_marker.png',
                  map: this.map
                });
              }
            }
            this.showCenterMarker = false;
            break;
          case ServiceState.ON_BOARD:
            this.showDestinationPlaceInput = false;
            this.refreshCenterMap(this.currentService);
            this.nearbyVehiclesEnabled = false;
            this.disableMap = false;
            this.nearbyVehicleList.forEach(vehicle => {
              vehicle.marker.setMap(undefined);
            });
            this.nearbyVehicleList = [];

            if (this.originMarker) {
              this.originMarker.setMap(undefined);
              this.originMarker = undefined;
            }
            if (this.currentService && location) {
              if (this.vehicleMarker) {
                this.changeMarkerPosition(
                  this.vehicleMarker,
                  location.lat,
                  location.lng
                );
              } else {
                this.vehicleMarker = new google.maps.Marker({
                  position: new google.maps.LatLng(
                    location.lat,
                    location.lng
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
            if (this.originMarker) {
              this.originMarker.setMap(undefined);
              this.originMarker = undefined;
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
        tap(R => console.log(R)),
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

  updateFirstOriginPlace(lat: number, lng: number) {
    // const geocoder = new google.maps.Geocoder();
    // const latlng = { lat, lng };

    // geocoder.geocode({ location: latlng }, (results, status) => {
    //   let locationName = (results[0] || { formatted_address: 'Mi Ubicación Actual' }).formatted_address;
    //   this.STRINGS_TO_REMOVE.forEach(s => locationName = locationName.replace(s, ''));
    //   this.serviceService.originPlaceSelected$.next({
    //     name: locationName,
    //     location: { lat, lng }
    //   });
    // });

    this.serviceService.originPlaceSelected$.next({
      name: 'Mi Ubicación Actual',
      location: { lat, lng }
    });

  }

  /* #endregion */
}
