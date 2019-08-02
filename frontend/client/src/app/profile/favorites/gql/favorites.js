import gql from "graphql-tag";

export const ClientFavoritePlaces = gql`
  query ClientFavoritePlaces {
    ClientFavoritePlaces {
      id
      type
      name
      location {
        lat
        lng
      }
    }
  }
`;

export const ClientFavoritePlace = gql`
  query ClientFavoritePlace($id: String) {
    ClientFavoritePlace(id: $id) {
      id
      type
      name
      location {
        lat
        lng
      }
    }
  }
`;


export const AddFavoritePlace = gql`
  mutation AddFavoritePlace($favoritePlace: FavoritePlaceInput) {
    AddFavoritePlace(favoriteType: $favoriteType) {
      code
      message
    }
  }
`;

export const UpdateFavoritePlace = gql`
  mutation UpdateFavoritePlace($favoritePlace: FavoritePlaceInput) {
    UpdateFavoritePlace(favoritePlace: $favoritePlace) {
      code
      message
    }
  }
`;

export const RemoveFavoritePlace = gql`
  mutation RemoveFavoritePlace($id: String, $name: String) {
    RemoveFavoritePlace(id: $id, name: $name) {
      code
      message
    }
  }
`;
