import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GatewayService } from '../api/gateway.service';
import { ClientProfile, ClientWalletUpdates, ClientLinkedSatellite, ValidateNewClient } from './gql/menu.js';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  currentUserProfile$ = new BehaviorSubject<{}>(null);
  currentLinkedSatellite$ = new BehaviorSubject<{}>(null);

  constructor(private gateway: GatewayService) {}
  /**
   *
   * @param satelliteId satellite to link to client
   */
  loadClientProfile$() {
    return this.gateway.apollo.query<any>({
      query: ClientProfile,
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  listenWalletUpdates$(walletId: string): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: ClientWalletUpdates,
      variables: { walletId }
    });
  }

  validateNewClient$() {
    return this.gateway.apollo.mutate<any>({
      mutation: ValidateNewClient,
      errorPolicy: 'all'
    });
  }

  loadSatelliteLinked$(satelliteId) {
    return this.gateway.apollo.query<any>({
      query: ClientLinkedSatellite,
      variables: { satelliteId },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }
}
