import { Injectable } from '@angular/core';
import { GatewayService } from '../../api/gateway.service';
import { ClientFavoritePlaces, AddFavoritePlace, UpdateFavoritePlace, RemoveFavoritePlace } from './gql/favorites';

@Injectable({
  providedIn: 'root'
})
export class ClienFavoriteService {
  constructor(private gateway: GatewayService) {}

  /**
   *
   * @param satelliteId satellite to link to client
   */
  updateFavoritePlace$(favoritePlace) {
    return this.gateway.apollo.mutate<any>({
      mutation: UpdateFavoritePlace,
      variables: { favoritePlace },
      errorPolicy: 'all'
    });
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


  getFavoritePlaces$() {
    return this.gateway.apollo.query<any>({
      query: ClientFavoritePlaces,
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }
}
