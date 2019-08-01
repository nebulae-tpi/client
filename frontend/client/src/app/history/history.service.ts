import { Injectable } from '@angular/core';
import { BehaviorSubject, of, Observable, iif, throwError } from 'rxjs';
import { GatewayService } from '../api/gateway.service';
import gql from 'graphql-tag';
import {
  HistoricalClientServices
} from './gql/history.js';
import { map, tap, retryWhen, concatMap, delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  backNavigation$ = new BehaviorSubject<any>(undefined);
  userProfile;

  constructor(private gateway: GatewayService) { }

  notifyBackNavigation() {
    this.backNavigation$.next(true);
  }



  /* #region QUERIES */
  getHistoryServices$(year, month, page, count) {
    // if (this.userProfile) {
      return this.gateway.apollo
        .query<any>({
          query: HistoricalClientServices,
          variables: {
            year, month, page, count
          },
          fetchPolicy: 'network-only',
          errorPolicy: 'all'
        });
    // } else {
    //   return of(undefined);
    // }
  }

}
