import { Injectable } from '@angular/core';
import { GatewayService } from '../api/gateway.service';
import { linkSatellite, ClientSatellites, unlinkSatellite, RemoveFavoritePlace, getBusinesses } from './gql/profile.js';

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

  getFilteredSatelliteList$(filterText, businessId) {
    return this.gateway.apollo.query<any>({
      query: ClientSatellites,
      fetchPolicy: 'network-only',
      variables: { filterText, businessId },
      errorPolicy: 'all'
    });
  }

  getbusinessList$(){
    return this.gateway.apollo.query<any>({
      query: getBusinesses,
      fetchPolicy: 'network-only',
      variables: {
        page: 0,
        count: 50,
        filterText: ""
      },
      errorPolicy: 'all'
    });
  }

  removeFavoritePlace$(id, name ) {
    return this.gateway.apollo.mutate<any>({
      mutation: RemoveFavoritePlace,
      variables: { id, name },
      errorPolicy: 'all'
    });
  }
}
