import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import {
  RequestService, CurrentServices, CancelServiceByClient, ClientServiceUpdatedSubscription
} from './gql/satellite.js';
import { GatewayService } from '../api/gateway.service';


@Injectable()
export class SatelliteService {


  constructor(
    private gateway: GatewayService
    ) {
  }

  /**
   * send a request service command to the server
   */
  requestService$(IOERequest: any) {
    return this.gateway.apollo
      .mutate<any>({
        mutation: RequestService,
        variables: {
          client: IOERequest.client,
          pickUp: IOERequest.pickUp,
          paymentType: IOERequest.paymentType,
          requestedFeatures: IOERequest.requestedFeatures,
          dropOff: IOERequest.dropOff,
          dropOffSpecialType: IOERequest.dropOffSpecialType,
          fareDiscount: IOERequest.fareDiscount,
          fare: IOERequest.fare,
          tip: IOERequest.tip,
          request: IOERequest.request
        },
        errorPolicy: 'all'
      });
  }

  /* #region  MUTATIONS */
  cancelService$(id, reason) {
    return this.gateway.apollo.mutate<any>({
      mutation: CancelServiceByClient,
      variables: { id, reason },
      errorPolicy: 'all'
    });
  }


  /**
   * Query all services filtered
   */
  queryServices$() {
    return this.gateway.apollo
      .query<any>({
        query: CurrentServices,
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      });
  }

  /**
   * Event triggered when a business is created, updated or deleted.
   */
  listenServiceUpdates$(): Observable<any> {
    return this.gateway.apollo
      .subscribe({
        query: ClientServiceUpdatedSubscription
      });
  }

}
