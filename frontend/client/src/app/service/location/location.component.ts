import {
  Component,
  OnInit,
  ViewChild,
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
} from 'rxjs/operators';
import { Subject, from, interval, of, Observable, forkJoin } from 'rxjs';
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
import { ORIGIN_DESTINATION_MATRIX_FARE } from '../specialFarePlaces/originDestinationMatrix';
import { PLACES_WITH_SPECIAL_FARE } from '../specialFarePlaces/places';
import { Router } from '@angular/router';
import { ClientChatService } from 'src/app/chat/client-chat.service';


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
      .subscribe(res => { }
      );
    this.bottomSheetRef.dismiss();
    // event.preventDefault();
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.bottomSheetRef.dismiss();
  }
}

declare const H: any;

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


  lat = 3.416652; // todo
  lng = -76.524436; // todo

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
  minTripCost = 4000; // todo query for minimal trip cost

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

  message= {  message: { textMessage: undefined } }

  layoutType = null;

  private ngUnsubscribe = new Subject();


  // direction display Element
  directionsDisplay: google.maps.DirectionsRenderer;
  directionsService: google.maps.DirectionsService;

  originPlace: any;

  // HERE Resources
  private herePlatform: any;
  private hereRouter: any;
  APP_ID = 'QdSYkExZVq0hsyj08FeA';
  APP_CODE = 'u5BMZRoXK2niQ8RZuHq2mg';

  constructor(
    private serviceService: ServiceService,
    private bottomSheet: MatBottomSheet,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private router: Router,
    private clientChatService: ClientChatService
  ) {

  }

  /* #region ANGULAR NGS */
  ngOnInit() {

    this.listenLayoutCommands();
    this.listenMarkerPosition();
    this.listenOnResume();
    this.listenCenterChanges();
    this.listenServiceCommands();
    this.clientChatService.listenNewChatMessages$().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(newMessage => {
      const wrapMessage = newMessage.data.ServiceMessageSubscription;
      this.message = wrapMessage;
      const tempData = this.clientChatService.messageList.getValue();
      tempData.push({ from: 'Conductor', message: wrapMessage.message.textMessage, timestamp: Date.now() });
      this.clientChatService.messageList.next(tempData);
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  listenOriginPlaceChanges() {
    this.serviceService.originPlaceSelected$
      .pipe(
        filter(place => place),
        filter(place => {
          if (place.name === null && place.location === null) {
            if (this.originMarker) {
              this.originMarker.setMap(null);
              this.originPlace = {};
            }
            return false;
          }
          return true;
        }),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(originPlace => {
        console.log('***[Location].listenOriginPlaceChanges*** ==> ', originPlace, '########');


        this.map.setCenter({ lat: originPlace.location.lat, lng: originPlace.location.lng });

        this.originPlace = originPlace;
        this.showCenterMarker = false;

        if (this.directionsDisplay) {
          this.directionsDisplay.setMap(null);
          this.estimatedTripCost = null;
        }

        if (!this.originMarker) {
          this.originMarker = new google.maps.Marker({
            position: {
              lat: originPlace.location.lat,
              lng: originPlace.location.lng,
            },
            icon: '../../../assets/icons/location/origin-place-30.png',
          });

        } else {
          this.originMarker.setPosition({
            lat: originPlace.location.lat,
            lng: originPlace.location.lng
          });
        }
        this.originMarker.setMap(this.map);

        this.map.setCenter(this.originMarker.getPosition());

        const buttonString = 'Fijar Con Puntero';
        this.originMarkerInfoWindow = new google.maps.InfoWindow({
          content: `
              <div id="origin-marker-info-window">
                <div id="bodyContent">
                <p><b>${originPlace.name}</b></p>
                <div id="use-pointer-btn" class="use-pointer-btn">${buttonString}</div>
              </div>`
        });

        this.originMarker.addListener('click', () => {
          this.originMarkerInfoWindow.open(this.map, this.originMarker);

          setTimeout(() => {
            const buttonHtmlRef = document.getElementById('use-pointer-btn');
            if (buttonHtmlRef) {
              buttonHtmlRef.addEventListener('mousedown', () => this.onUsePointerToSetLocation('ORIGIN'));
            }
          }, 200);

        });





      });
  }

  listenDestinationPlaceChanges() {
    this.serviceService.destinationPlaceSelected$
      .pipe(
        filter(place => place),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(destinationPlace => {
        this.destinationPlace = destinationPlace;

        if (this.directionsDisplay) {
          this.directionsDisplay.setMap(null);
          this.estimatedTripCost = null;
        }

        this.showCenterMarker = false;
        this.placeToMoveWithCenter = null;


        this.destinationMarker = this.destinationMarker || new google.maps.Marker({
          position: new google.maps.LatLng(0, 0),
          icon: '../../../assets/icons/location/destination-place-30.png',
          map: this.map
        });

        this.destinationMarker.setPosition({
          lat: destinationPlace.location.lat,
          lng: destinationPlace.location.lng
        });



        // UPDATE THE ZOOM AND CENTER TO SHOW DESTINATION AND ORIGINMARKER ON MAP
        const bounds = new google.maps.LatLngBounds();
        if (this.originMarker) {
          bounds.extend(this.originMarker.getPosition());
        }

        if (bounds && this.destinationMarker) {
          bounds.extend(this.destinationMarker.getPosition());

        }

        if (this.map && bounds) {
          this.map.fitBounds(bounds); // { top: 40, right: 40, bottom: 40, left: 40 }
        }
        // UPDATE THE ZOOM AND CENTER TO SHOW DESTINATION AND ORIGINMARKER ON MAP

      });





  }



  listenServiceCommands() {
    this.serviceService.serviceCommands$.pipe(
      filter(command => command && command.code),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(command => {
      switch (command.code) {
        case ServiceService.COMMAND_ON_CONFIRM_BTN:

          // console.log('***[Location].listenServiceCommands*** ServiceService.COMMAND_ON_CONFIRM_BTN', {
          //   originPlace: this.originPlace,
          //   lastCenterReported: this.lastCenterReported
          // });

          const originLatLnglocation = {
            lat: (this.originPlace || {}).location 
              ? this.originPlace.location.lat 
              : (this.lastCenterReported || {}).lat,
            lng: (this.originPlace || {}).location 
              ? this.originPlace.location.lng 
              : (this.lastCenterReported || {}).lng
          };

          if (!originLatLnglocation.lat || !originLatLnglocation.lng) {
            console.log('!!!!! NO HAY CON CONSTRUIR LAS COORDENADAS DEL ORIGEN');
            break;
          }

          this.originPlace = {
            ...this.originPlace,
            location: originLatLnglocation
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


          this.serviceService.publishOriginPlace(this.originPlace);

          if (this.destinationMarker) {
            this.calculateRoute( this.originPlace.location );
          }
          /*else {
            this.serviceService.publishCommand({
              code: ServiceService.COMMAND_REQUEST_STATE_SHOW_FILTERS,
              args: []
            });
          }
          */

          break;
        case ServiceService.COMMAND_MOVING_MARKER_WITH_CENTER:

          if (command.args[0] === undefined) {
            const markerToUpdatePosition = this.placeToMoveWithCenter;
            this.showCenterMarker = false;
            this.placeToMoveWithCenter = null;
            if (markerToUpdatePosition === 'ORIGIN') {
              this.originMarker.setOptions({
                position: { lat: this.lastCenterReported.lat, lng: this.lastCenterReported.lng },
                visible: true
              });
            }
          }

          break;

        default:
          break;
      }
    });
  }

  onUsePointerToSetLocation(e: string) {
    switch (e) {
      case 'ORIGIN':
        this.originMarkerInfoWindow.close();
        const newCenter = new google.maps.LatLng(this.originPlace.location.lat, this.originPlace.location.lng);
        this.map.setCenter(newCenter);
        const newMapZoom = this.map.getZoom() + 2;
        // tslint:disable-next-line: no-unused-expression
        newMapZoom < 19 ? this.map.setZoom(newMapZoom) : {};
        this.serviceService.publishCommand({
          code: ServiceService.COMMAND_MOVING_MARKER_WITH_CENTER,
          args: ['ORIGIN']
        });
        this.originMarker.setOptions({
          position: this.originMarker.getPosition(),
          visible: false
        });
        this.placeToMoveWithCenter = 'ORIGIN';
        this.showCenterMarker = true;

        break;

      default:
        break;
    }

  }



  buildDestinationPlaceAutoComplete(circle?) {
    if (!this.destinationPlaceSearchElementRef) {
      setTimeout(() => {
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

          (this.destinationPlace || {}).favorite = (formatted_address === '[FAVORITE]');
          let destinationPlaceName = this.destinationPlace.favorite
            ? `${name}`.trim()
            : `${name}, ${formatted_address.split(',').slice(1)}`.trim();

          this.STRINGS_TO_REMOVE.forEach(s => destinationPlaceName = destinationPlaceName.replace(s, ''));


          this.destinationPlace.name = destinationPlaceName;
          this.destinationPlaceSearchElementRef.nativeElement.value = destinationPlaceName;

          this.serviceService.publishServiceChanges({ state: ServiceState.REQUEST });



          console.log('----------------- LUGAR INICIAL ==> ', this.originPlace);

          if (!this.originPlace || this.originPlace === {}) {
            console.log('PUBLICANDO EL ORIGEN INICIAL');

            this.serviceService.publishOriginPlace({
              name: 'Mi Ubicación',
              location: {
                lat: this.lastCenterReported.lat,
                lng: this.lastCenterReported.lng
              }
            });
          }


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
        this.destinationPlaceAutocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
      }
    });
  }


  listenCenterChanges() {
    this.center$
      .pipe(
        filter((center: any) => {
          const isDifferentLocation = this.lastCenterReported && this.lastCenterReported.lat !== center.lat;
          this.lastCenterReported = center;
          // console.log('***[Location].listenCenterChanges*** updating lastCenterReported', this.lastCenterReported);

          return isDifferentLocation;
        }),
        tap((center: any) => {

          if (this.originMarker && this.placeToMoveWithCenter === 'ORIGIN') {
            this.originMarker.setPosition({ lat: center.lat, lng: center.lng });
          }
          if (this.destinationMarker && this.placeToMoveWithCenter === 'DESTINATION') {
            this.destinationMarker.setPosition({ lat: center.lat, lng: center.lng });
          }

        }),
        debounceTime(500),

        tap((val: any) => {
          this.serviceService.markerOnMapChange$.next({
            latitude: val.lat,
            longitude: val.lng
          });
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
    // console.log('***[Location].currentLocation()***');


    const availableStates = [ServiceState.REQUESTED, ServiceState.ASSIGNED, ServiceState.ARRIVED];

    if (this.map !== undefined && this.currentService && availableStates.includes(this.currentService.state)) {
      this.map.setCenter({
        lat: this.currentService.pickUp.marker.lat,
        lng: this.currentService.pickUp.marker.lng
      });
      this.map.setZoom(17);
    } else if (this.map !== undefined && this.currentService && this.currentService.state === ServiceState.ON_BOARD) {
      this.map.setCenter({
        lat: this.currentService.location.lat,
        lng: this.currentService.location.lng
      });
      this.map.setZoom(17);
    } else if (navigator.geolocation) {

      navigator.geolocation.getCurrentPosition(position => {
        // console.log('***[Location].currentLocation***', 'geolocation.getCurrentPosition setting map center', position);

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

  openClientChatView() {
    this.router.navigate(['/clientchat']);
  }


  initLocation() {
    console.log('***[Location].initLocation()***');

    this.currentService = this.serviceService.currentService$.getValue();
    const markerOnMap = this.serviceService.markerOnMapChange$.getValue();

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

              if (!this.serviceService.originPlaceSelected$.getValue()) {
                this.updateFirstOriginPlace(position.coords.latitude, position.coords.longitude);
              }
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

    this.map = mapRef;

    this.initLocation();
    this.listenServiceChanges();
    this.startNearbyVehicles();
    if (this.currentService && this.currentService.state === ServiceState.NO_SERVICE && this.showDestinationPlaceInput) {
      // setTimeout(() => {
      this.buildDestinationPlaceAutoComplete();
      // }, 1000);
    }


    this.listenOriginPlaceChanges();
    this.listenDestinationPlaceChanges();

  }


  searchAdditionalTripFare$(estimatedTripValue, originLatLng, destinationLatLng) {
    return forkJoin(
      of(PLACES_WITH_SPECIAL_FARE
        .filter(place => this.isPointInPolygon({ lat: originLatLng.lat, lng: originLatLng.lng }, place.points))
      [0]
      ),
      of(PLACES_WITH_SPECIAL_FARE
        .filter(place => this.isPointInPolygon({ lat: destinationLatLng.lat, lng: destinationLatLng.lng }, place.points))
      [0]
      ),
    )
      .pipe(
        map(([specialOrigin, specialDestination]) => (specialOrigin && specialDestination)
          ? ORIGIN_DESTINATION_MATRIX_FARE
            .find(item => (specialOrigin.name === item.from && specialDestination.name === item.to))
          : null
        ),
        map((additionalFare: any) => !additionalFare
          ? estimatedTripValue
          : {
            ...estimatedTripValue,
            cost: additionalFare.fare
          }),
      );


  }

  isPointInPolygon(point, polygonPoints) {
    return PLACES_WITH_SPECIAL_FARE.find(e => {
      const pointLatLng = new google.maps.LatLng(point.lat, point.lng);
      const placePolygon = new google.maps.Polygon({ paths: polygonPoints });

      return google.maps.geometry.poly.containsLocation(pointLatLng, placePolygon);

    });
  }

  /**
   * 
   * @param location 
   */
  calculateRoute(location: { lat: any, lng: any }) {
    this.herePlatform = this.herePlatform || new H.service.Platform({
      app_id: this.APP_ID,
      app_code: this.APP_CODE,
    });

    // Get an instance of the routing service:
    this.hereRouter = this.hereRouter || this.herePlatform.getRoutingService();


    const originLatLng = this.originPlace.location;
    const destinationLatLng = this.destinationPlace.location;

    console.log({ originLatLng, destinationLatLng });



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
              strokeWeight: 5
            },
            suppressMarkers: true,
            directions: response
          });

          response.routes[0].legs.forEach(leg => {
            tripDistance += leg.distance.value;
            tripDuration += leg.duration.value;
          });
          observer.next({
            duration: tripDuration,
            distance: Math.floor((tripDistance / 1000) * 100) / 100, // meters to kms
            cost: 0
          });

        } else {
          observer.next(null);
        }
        observer.complete();
      });

      // const routingParameters = {
      //   mode: 'fastest;car;traffic:disabled',
      //   waypoint0: `geo!${originLatLng.lat},${originLatLng.lng}`,
      //   waypoint1: `geo!${destinationLatLng.lat},${destinationLatLng.lng}`,
      //   departure: 'now',
      //   // representation: 'display'
      // };

      // this.hereRouter.calculateRoute(routingParameters, (requestResponse) => {
      //   console.log('HERE RESPONSE ==> ', requestResponse);
      //   if (requestResponse && requestResponse.response && requestResponse.response.route) {
      //     const route = requestResponse.response.route;
      //     const { leg, summary } = route[0];
      //     if (summary) {
      //       observer.next({
      //         duration: summary.travelTime,
      //         distance: Math.floor((summary.distance / 1000) * 100) / 100,
      //         cost: 0
      //       });
      //       observer.complete();

      //     }
      //   }
      //   observer.next(null);
      //   observer.complete();
      // },
      //   (error) => {
      //     console.log(error);
      //     observer.next(null);
      //   });
    }).pipe(
      mergeMap(estimatedResult => this.searchAdditionalTripFare$(estimatedResult, originLatLng, destinationLatLng)),
      filter((response: any) => response),
      mergeMap(result => forkJoin(
        of(result),
        this.serviceService.getFareSettings$(location)
      )),
      map(([estimatedFare, fareSettingsResult]) =>
        [
          estimatedFare,
          ((fareSettingsResult || {}).data || {}).FareSettings || { valuePerKilometer: 1550, additionalCost: 0, minimalTripCost: 4000 },

        ]
      )
    ).subscribe(([estimatedFare, fareSettings]) => {
      this.estimatedTripCost = estimatedFare;


      const rawCostResult = Math.ceil(parseFloat(this.estimatedTripCost.distance) * fareSettings.valuePerKilometer);

      // apply fare discount
      let cost = rawCostResult * 1; // 0% discount


      cost = ( cost + 50 - (cost % 50) );
      cost = cost + fareSettings.additionalCost;



      if (cost < fareSettings.minimalTripCost) {
        cost = fareSettings.minimalTripCost;
      }

      const formatter = new Intl.NumberFormat("es");

      const priceFormated = formatter.format(cost + this.estimatedTripCost.cost );

      this.estimatedTripCost.cost = priceFormated;

      this.serviceService.publishCommand({
        code: ServiceService.COMMAND_TRIP_COST_CALCULATED,
        args: [{
          ...estimatedFare,
          rawCost: cost
        }]
      });

    });
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
         // console.log('***[Location].listenMarkerPosition***');
        if (this.map) {

          this.map.setCenter({
            lat: location.latitude,
            lng: location.longitude
          });
        }
        const circle = new google.maps.Circle({
          center: {
            lat: location.latitude,
            lng: location.longitude
          },
          radius: 20000 // meters
        });



        if (!this.destinationPlaceAutocomplete) {
          this.buildDestinationPlaceAutoComplete(circle);
        } else if (this.showDestinationPlaceInput) {
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
        const { state, pickUp, location } = this.currentService;

        switch (state) {
          case ServiceState.NO_SERVICE:
            if (this.destinationPlaceSearchElementRef) {
              this.destinationPlaceSearchElementRef.nativeElement.value = '';
            }

            this.estimatedTripCost = null;
            this.disableMap = false;
            if (this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT) {
              this.showDestinationPlaceInput = true;
            }
            this.serviceService.publishOriginPlace({ name: null, location: null });
            if (this.destinationMarker) {
              this.destinationMarker.setMap(null);
              this.destinationMarker = null;
            }

            this.showCenterMarker = true;

            if (this.originMarker) {
              this.originMarker.setMap(null);
            }




            if (this.directionsDisplay) {
              this.directionsDisplay.setMap(null);
            }


            break;
          case ServiceState.CANCELLED_CLIENT:
            this.showDestinationPlaceInput = true;
            this.estimatedTripCost = null;
            this.serviceService.publishServiceChanges({ state: ServiceState.NO_SERVICE });
            this.clearOriginDestinationPlacesAndMarkers();
            break;
          case ServiceState.CANCELLED_DRIVER:
            this.showDestinationPlaceInput = true;
            this.estimatedTripCost = null;
            break;
          case ServiceState.CANCELLED_OPERATOR:
            this.showDestinationPlaceInput = true;
            this.estimatedTripCost = null;
            break;
          case ServiceState.CANCELLED_SYSTEM:
            this.showDestinationPlaceInput = true;
            this.estimatedTripCost = null;
            break;
          case ServiceState.DONE:
            this.showDestinationPlaceInput = true;
            break;
          case ServiceState.REQUEST:
            this.showDestinationPlaceInput = false;
            if (!this.originPlace) {
              this.serviceService.originPlaceSelected$.next({
                name: '',
                location: {
                  lat: this.lastCenterReported.lat,
                  lng: this.lastCenterReported.lng
                }
              });
            }

            break;
          case ServiceState.REQUESTED:
            this.showDestinationPlaceInput = false;
            this.refreshCenterMap(this.currentService);
            this.disableMap = true;
            if (this.currentService && pickUp && pickUp.marker) {
              if (!this.originMarker) {
                this.originMarker = new google.maps.Marker({
                  position: {
                    lat: pickUp.marker.lat,
                    lng: pickUp.marker.lng
                  },
                  icon: '../../../assets/icons/location/destination-place-30.png',
                  map: this.map
                });
              } else {
                this.originMarker.setPosition({
                  lat: pickUp.marker.lat,
                  lng: pickUp.marker.lng
                });
              }



            }
            this.showCenterMarker = false;
            break;
          case ServiceState.ARRIVED:
            this.showDestinationPlaceInput = true;
            this.showDestinationPlaceInput = false;
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
              vehicle.marker.setMap(null);
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
              vehicle.marker.setMap(null);
            });
            this.nearbyVehicleList = [];

            if (this.originMarker) {
              this.originMarker.setMap(null);
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
              if (service.fareDiscount && service.fareDiscount > 0) {
                // TODO read farediscount
                this.snackBar.open(
                  `Recuerde que tiene ${service.fareDiscount * 100}% de dcto sobre el valor total del servicio`,
                  'Cerrar',
                  { duration: 10000 }
                );

              }

            }
            break;
          default:
            if (this.vehicleMarker) {
              this.vehicleMarker.setMap(null);
              this.vehicleMarker = undefined;
            }
            if (this.originMarker) {
              this.originMarker.setMap(null);
              this.originMarker = undefined;
            }

            this.disableMap = false;
            this.currentService = undefined;
            this.showCenterMarker = true;
            this.nearbyVehiclesEnabled = true;
            this.estimatedTripCost = null;
            break;
        }

        this.lastServiceStateReported = service.state;

      });
  }

  clearOriginDestinationPlacesAndMarkers() {
    if (this.originMarker) {
      this.originMarker.setMap(null);
    }
    this.originPlace = {};


    if (this.destinationMarker) {
      this.destinationMarker.setMap(null);
    }
    this.destinationPlace = {};
  }




  /* #endregion */

  /* #region QUERIES */
  startNearbyVehicles() {
    interval(20000) // todo set in 5000 for production
      .pipe(
        filter(() => this.nearbyVehiclesEnabled),
        mergeMap(() => this.getNearbyVehicles$()),
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
    if (!this.serviceService.userProfile$.getValue()) {
      return of(null);
    }
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
            tap(v => v.marker.setMap(null)),
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
              vehicle.marker.setMap(null);
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


    this.serviceService.publishOriginPlace({
      name: 'Mi Ubicación Actual',
      location: { lat, lng }
    });

  }

  /* #endregion */
}
