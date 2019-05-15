import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import {
  IOERequestService, IOEServices, IOECancelService, IOEServiceSubscription
} from './gql/satellite.js';
import { GatewayService } from '../api/gateway.service.js';


@Injectable()
export class SatelliteService {


  constructor(private gateway: GatewayService) {
  }

  /**
   * send a request service command to the server
   * @param IOERequest
   */
  requestService$(IOERequest: any) {
    return this.gateway.apollo
      .mutate<any>({
        mutation: IOERequestService,
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

  /**
   * send a cancel service command to the server
   * @param IOECommand
   */
  cancelService$(IOECommand: any) {
    return this.gateway.apollo
      .mutate<any>({
        mutation: IOECancelService,
        variables: {
          id: IOECommand.id,
          reason: IOECommand.reason,
          authorType: IOECommand.authorType,
          notes: IOECommand.notes,
        },
        errorPolicy: 'all'
      });
  }


  /**
   * Query all services filtered
   * @param IOERequest
   */
  queryServices$(serviceStatesFilter, serviceChannelsFilter, viewAllOperators, businessId, page, pageCount, monthsToAdd, projections) {
    return this.gateway.apollo
      .query<any>({
        query: IOEServices,
        variables: {
          serviceStatesFilter, serviceChannelsFilter, viewAllOperators, businessId, page, pageCount, monthsToAdd, projections
        },
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      });
  }

  /**
   * Event triggered when a business is created, updated or deleted.
   */
  listenIOEService$(businessId, operatorId, statesFilter, channelsFilter): Observable<any> {
    return this.gateway.apollo
      .subscribe({
        query: IOEServiceSubscription,
        variables: {
          businessId, operatorId, statesFilter, channelsFilter
        }
      });
  }

}
