import { Injectable } from '@angular/core';
import { BehaviorSubject, of, Observable, iif, throwError } from 'rxjs';
import { ServiceState } from './service-state';
import { GatewayService } from '../api/gateway.service';
import {
  NearbyVehicles,
  ValidateNewClient,
  RequestService,
  CurrentServices,
  CancelServiceByClient,
  BusinessContactInfo,
  RemoveFavoritePlace,
  AddFavoritePlace,
  FareSettings,
  ClientServiceUpdatedSubscription
} from './gql/service.js';
import { map, tap, retryWhen, concatMap, delay, distinctUntilChanged, filter, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  // LAYOUT MODES
  public static LAYOUT_MOBILE_HORIZONTAL_ADDRESS_MAP_CONTENT = 0;
  public static LAYOUT_MOBILE_HORIZONTAL_MAP_CONTENT = 1;
  public static LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT = 2;
  // public static LAYOUT_MOBILE_VERTICAL_MAP_CONTENT = 3;
  public static LAYOUT_DESKTOP_ADDRESS_MAP_CONTENT = 4;
  public static LAYOUT_DESKTOP_MAP_CONTENT = 5;
  public static LAYOUT_ADDRESS_MAP_CONTENT = 6;
  // LAYOUT MODES

  // COMMANDS TYPES
  public static LAYOUT_COMMAND_SHOW_ADDRESS = 100;
  public static LAYOUT_COMMAND_HIDE_ADDRESS = 101;

  public static COMMAND_ON_CONFIRM_BTN = 200;

  public static COMMAND_REQUEST_ORIGIN_DESTINATION_SELECTION = 201;
  public static COMMAND_REQUEST_STATE_SHOW_FILTERS = 202;

  public static COMMAND_TRIP_COST_CALCULATED = 203;
  public static COMMAND_MOVING_MARKER_WITH_CENTER = 204;

  public static COMMAND_USE_FAVORITE_PLACE_TO_REQUEST_SERVICE = 205;
  // COMMANDS TYPES

  layoutChanges$ = new BehaviorSubject(undefined);
  serviceCommands$ = new BehaviorSubject(undefined);

  markerOnMapChange$ = new BehaviorSubject(undefined);

  onResume$ = new BehaviorSubject(undefined);

  currentService$ = new BehaviorSubject<any>({
    state: ServiceState.NO_SERVICE
  });

  backNavigation$ = new BehaviorSubject<any>(undefined);
  mapsApiLoaded$ = new BehaviorSubject(null);

  userProfile$ = new BehaviorSubject(undefined);
  businessContactInfo;


  // Origin and destination selection observables
  originPlaceSelected$ = new BehaviorSubject(undefined);
  destinationPlaceSelected$ = new BehaviorSubject(undefined);

  constructor(private gateway: GatewayService) { }

  notifyBackNavigation() {
    this.backNavigation$.next(true);
  }

  /* #region QUERIES */
  getNearbyVehicles() {
    const marker = this.markerOnMapChange$.getValue();
    if (marker) {
      return this.gateway.apollo.query<any>({
        query: NearbyVehicles,
        variables: {
          clientLocation: {
            lat: marker.latitude,
            lng: marker.longitude
          },
          filters: []
        },
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      });
    } else {
      return of(undefined);
    }
  }

  getCurrentService$() {
    return this.userProfile$
      .pipe(
        filter(userProfile => userProfile !== undefined),
        mergeMap(userProfile => !userProfile
          ? of(null)
          : this.gateway.apollo
            .query<any>({
              query: CurrentServices,
              fetchPolicy: 'network-only',
              errorPolicy: 'all'
            })
            .pipe(
              map(result => {
                if ((result.data || {}).CurrentServices) {
                  return result.data.CurrentServices.length > 0
                    ? result.data.CurrentServices[0]
                    : undefined;
                }
                return undefined;
              }),
              retryWhen(errors =>
                errors.pipe(
                  concatMap((e, i) =>
                    // Executes a conditional Observable depending on the result
                    // of the first argument
                    iif(() => i > 3,
                      // If the condition is true we throw the error (the last error)
                      throwError(e),
                      // Otherwise we pipe this back into our stream and delay the retry
                      of(e).pipe(delay(500))
                    )
                  )
                )
              )
            )
      )
    );
  }

  getBusinessContactInfo$() {
    if (this.userProfile$.getValue()) {
      return this.gateway.apollo
        .query<any>({
          query: BusinessContactInfo,
          fetchPolicy: 'network-only',
          errorPolicy: 'all'
        })
        .pipe(
          map(result => (result.data || {}).BusinessContactInfo),
          tap(business => {
            this.businessContactInfo = business;
          })
        );
    } else {
      return of(undefined);
    }
  }

  /**
   * 
   * @param location latitude and longitude
   */
  getFareSettings$( location: { lat: number, lng: number } ) {
    if (this.userProfile$.getValue()) {
      return this.gateway.apollo
        .query<any>({
          variables: { lat: location.lat, lng: location.lng },
          query: FareSettings,
          fetchPolicy: 'network-only',
          errorPolicy: 'all'
        });
    } else {
      return of(undefined);
    }

  }
  /* #endregion */

  /* #region  MUTATIONS */
  cancelService$(reason) {
    const currentService = this.currentService$.getValue();
    return this.gateway.apollo.mutate<any>({
      mutation: CancelServiceByClient,
      variables: {
        id: currentService._id,
        reason
      },
      errorPolicy: 'all'
    });
  }

  createNewService$(clientUsername: string, pickUp, dropOff, serviceTip, tripCost?: number) {
    return this.gateway.apollo.mutate<any>({
      mutation: RequestService,
      variables: {
        pickUp,
        /*
        : {
          marker: pickUpLocation,
          addressLine1: address,
          addressLine2: reference,
          neighborhood: 'Solicitud app cliente',
          zone: ''
        }
         */
        dropOff,
        paymentType: 'CASH',
        requestFeatures: [],
        tip: serviceTip > 0 ? serviceTip : undefined,
        tripCost
      },
      errorPolicy: 'all'
    });
  }
  /* #endregion */

  /* #region  GQL SUBSCRIPTIONS */
  subscribeToClientServiceUpdatedSubscription$(): Observable<any> {
    return this.gateway.apollo
      .subscribe({
        query: ClientServiceUpdatedSubscription
      })
      .pipe(
        map(result => ((result.data || {}) as any).ClientServiceUpdatedSubscription)
      );
  }
  /* #endregion */


  publishLayoutChange(
    type: number,
    addressWidth: number,
    addressHeight: number,
    mapWidth: number,
    mapHeight: number,
    contextWidth?: number,
    contextHeight?: number
  ) {
    // console.log('PUBLISHING LAYOUT COMMANDS ...');

    this.layoutChanges$.next({
      layout: {
        type,
        address: {
          width: addressWidth,
          height: addressHeight,
          visible: true
        },
        map: {
          width: mapWidth,
          height: mapHeight,
          visible: true
        },
        context: {
          width: contextWidth,
          height: contextHeight,
          visible: contextHeight && contextWidth
        },
        total: {
          width: addressWidth + mapWidth +
            (contextWidth && type === ServiceService.LAYOUT_MOBILE_HORIZONTAL_ADDRESS_MAP_CONTENT
              ? contextWidth
              : 0
            ),
          height: addressHeight + mapHeight +
            (contextHeight &&
              type === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT
              ? contextHeight
              : 0
            )
        }
      }
    });
  }

  publishOriginPlace(place) {
    this.originPlaceSelected$.next(place);
  }

  updateUserProfileUpdate(userProfile) {
    // console.log('***[ServiceService].updateUserProfileUpdate***', userProfile);
    this.userProfile$.next(userProfile);
  }

  /**
   *
   * @param satelliteId satellite to link to client
   */
  removeFavoritePlace$(id: string, name: string) {
    return this.gateway.apollo.mutate<any>({
      mutation: RemoveFavoritePlace,
      variables: { id, name },
      errorPolicy: 'all'
    });
  }

  /**
   *
   * @param satelliteId satellite to link to client
   */
  addFavoritePlace$(favoritePlace) {
    return this.gateway.apollo.mutate<any>({
      mutation: AddFavoritePlace,
      variables: { favoritePlace },
      errorPolicy: 'all'
    });
  }

  publishServiceChanges(serviceChanges) {
    if (JSON.stringify(this.currentService$.getValue()) === JSON.stringify(serviceChanges)) {
      return;
    }
    console.log('CURRENT SERVICE ===> ', serviceChanges);
    const newService = {
      ...this.currentService$.getValue(),
      ...serviceChanges
    };
    this.currentService$.next(newService);
  }

  publishCommand(command) {
    this.serviceCommands$.next(command);
  }
}
