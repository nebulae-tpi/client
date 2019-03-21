import { Injectable } from '@angular/core';
import { BehaviorSubject, of, Observable } from 'rxjs';
import { ServiceState } from './service-state';
import { GatewayService } from '../api/gateway.service';
import gql from 'graphql-tag';
import {
  NearbyVehicles,
  ValidateNewClient,
  RequestService,
  CurrentServices,
  CancelServiceByClient
} from './gql/service.js';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  /* #region  VARIABLES*/
  public static LAYOUT_MOBILE_HORIZONTAL_ADDRESS_MAP_CONTENT = 0;
  public static LAYOUT_MOBILE_HORIZONTAL_MAP_CONTENT = 1;
  public static LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT = 2;
  public static LAYOUT_MOBILE_VERTICAL_MAP_CONTENT = 3;
  public static LAYOUT_DESKTOP_ADDRESS_MAP_CONTENT = 4;
  public static LAYOUT_DESKTOP_MAP_CONTENT = 5;
  public static LAYOUT_ADDRESS_MAP_CONTENT = 6;

  public static LAYOUT_COMMAND_SHOW_ADDRESS = 100;
  public static LAYOUT_COMMAND_HIDE_ADDRESS = 101;
  /**
   * layout dimension observable
   */
  layoutChanges$ = new BehaviorSubject(undefined);

  locationChange$ = new BehaviorSubject(undefined);

  addressChange$ = new BehaviorSubject(undefined);

  currentService$ = new BehaviorSubject<any>({
    state: ServiceState.NO_SERVICE
  });

  userProfile;
  /* #endregion */

  constructor(private gateway: GatewayService) {}

  /* #region QUERIES */
  getNearbyVehicles() {
    this.locationChange$.getValue();
    if (this.locationChange$.getValue()) {
      return this.gateway.apollo.query<any>({
        query: NearbyVehicles,
        variables: {
          clientLocation: {
            lat: this.locationChange$.getValue().latitude,
            lng: this.locationChange$.getValue().longitude
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
    if (this.userProfile) {
      return this.gateway.apollo
        .query<any>({
          query: CurrentServices,
          fetchPolicy: 'network-only',
          errorPolicy: 'all'
        })
        .pipe(
          map(result => {
            if (result.data && result.data.CurrentServices) {
              return result.data.CurrentServices.length > 0
                ? result.data.CurrentServices[0]
                : undefined;
            } else {
              return undefined;
            }
          })
        );
    } else {
      return of(undefined);
    }
  }
  /* #endregion */

  /* #region  MUTATIONS */
  validateNewClient$() {
    return this.gateway.apollo.mutate<any>({
      mutation: ValidateNewClient,
      errorPolicy: 'all'
    });
  }

  cancelService$(reason) {
    return this.gateway.apollo.mutate<any>({
      mutation: CancelServiceByClient,
      variables: {
        id: this.currentService$.getValue()._id,
        reason
      },
      errorPolicy: 'all'
    });
  }

  createNewService$(
    clientUsername: String,
    pickUpLocation,
    address: String,
    reference: String,
    serviceTip
  ) {
    return this.gateway.apollo.mutate<any>({
      mutation: RequestService,
      variables: {
        pickUp: {
          marker: pickUpLocation,
          addressLine1: address,
          addressLine2: reference
        },
        paymentType: 'CASH',
        requestFeatures: [],
        tip: serviceTip > 0 ? serviceTip : undefined
      },
      errorPolicy: 'all'
    });
  }
  /* #endregion */

  /* #region  GQL SUBSCRIPTIONS */
  subscribeToClientServiceUpdatedSubscription$(): Observable<any> {
    return this.gateway.apollo
      .subscribe({
        query: gql`
          subscription ClientServiceUpdatedSubscription {
            ClientServiceUpdatedSubscription {
              _id
              timestamp
              vehicle {
                plate
              }
              driver {
                fullname
              }
              pickUp {
                marker {
                  lat
                  lng
                }
                addressLine1
                addressLine2
              }
              dropOff {
                marker {
                  lat
                  lng
                }
                addressLine1
                addressLine2
              }
              location {
                lat
                lng
              }
              dropOffSpecialType
              verificationCode
              requestedFeatures
              paymentType
              fareDiscount
              fare
              tip
              route {
                lat
                lng
              }
              lastModificationTimestamp
              state
            }
          }
        `
      })
      .pipe(
        map(result => {
          return result.data && result.data.ClientServiceUpdatedSubscription
            ? result.data.ClientServiceUpdatedSubscription
            : undefined;
        })
      );
  }
  /* #endregion */

  // tslint:disable-next-line:max-line-length
  publishLayoutChange(
    type: number,
    addressWidth: number,
    addressHeight: number,
    mapWidth: number,
    mapHeight: number,
    contextWidth?: number,
    contextHeight?: number
  ) {
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
          width:
            addressWidth +
            mapWidth +
            (contextWidth &&
            type === ServiceService.LAYOUT_MOBILE_HORIZONTAL_ADDRESS_MAP_CONTENT
              ? contextWidth
              : 0),
          height:
            addressHeight +
            mapHeight +
            (contextHeight &&
            type === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT
              ? contextHeight
              : 0)
        }
      }
    });
  }

  publishServiceChanges(serviceChanges) {
    const newService = {
      ...this.currentService$.getValue(),
      ...serviceChanges
    };
    this.currentService$.next(newService);
  }
}
