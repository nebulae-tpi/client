import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { ServiceState } from './service-state';
import { GatewayService } from '../api/gateway.service';
import { NearbyVehicles, ValidateNewClient } from './gql/service.js';

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
  /* #endregion */

  constructor(private gateway: GatewayService) {}

  /* #region QUERIES */
  getNearbyVehicles() {
    this.locationChange$.getValue();
    if (this.locationChange$.getValue()) {
      return this.gateway.apollo.query<any>({
        query: ValidateNewClient,
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      });
    } else {
      return of(undefined);
    }
  }
  /* #endregion */

  validateNewClient$() {
    return this.gateway.apollo.mutate<any>({
      mutation: ValidateNewClient,
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
  }

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
}
