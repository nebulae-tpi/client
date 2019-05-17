import { Injectable } from '@angular/core';
import { GatewayService } from '../api/gateway.service';
import { linkSatellite, ClientSatellites, unlinkSatellite, RemoveFavoritePlace } from './gql/profile.js';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private gateway: GatewayService) {}

  /**
   *
   * @param satelliteId satellite to link to client
   */
  linkSatellite$(satelliteId) {
    return this.gateway.apollo.mutate<any>({
      mutation: linkSatellite,
      variables: { satelliteId },
      errorPolicy: 'all'
    });
  }

  unlinkSatellite$() {
    return this.gateway.apollo.mutate<any>({
      mutation: unlinkSatellite,
      errorPolicy: 'all'
    });
  }

  getFilteredSatelliteList$(filterText) {
    return this.gateway.apollo.query<any>({
      query: ClientSatellites,
      fetchPolicy: 'network-only',
      variables: { filterText },
      errorPolicy: 'all'
    });
  }

  removeMainFavorite$(id) {
    return this.gateway.apollo.mutate<any>({
      mutation: RemoveFavoritePlace,
      variables: { id },
      errorPolicy: 'all'
    });
  }
}
