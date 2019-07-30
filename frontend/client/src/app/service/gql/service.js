import gql from 'graphql-tag';

/* #region  QUERY */

export const BusinessContactInfo = gql`
  query BusinessContactInfo {
    BusinessContactInfo{
      name
      whatsapp
      phone
      businessId
    }
  }
`;

export const NearbyVehicles = gql`
  query NearbyVehicles($clientLocation: PointInput!, $filters: [String]) {
    NearbyVehicles(clientLocation: $clientLocation, filters: $filters) {
      vehicleId
      point {
        lat
        lng
      }
    }
  }
`;

export const fareSettings = gql`
  query fareSettings {
    fareSettings{
      valuePerKilometer
      additionalCost
      minimalTripCost
    }

  }
`;

export const CurrentServices = gql`
  query CurrentServices {
    CurrentServices {
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
      pickUpETA
    }
  }
`;
/* #endregion */

/* #region  MUTATION */
export const CancelServiceByClient = gql`
  mutation CancelServiceByClient($id: String!, $reason: String!, $notes: String){
  CancelServiceByClient(id: $id, reason: $reason, notes: $notes){
    accepted
  }
}
`;

export const RequestService = gql`
  mutation RequestService($pickUp: LocationInput!, $paymentType: String!, $requestedFeatures: [String], $dropOff: LocationInput, $tip: Int, $tripCost: Int ) {
    RequestService( pickUp: $pickUp, paymentType: $paymentType, requestedFeatures: $requestedFeatures, dropOff: $dropOff, tip: $tip, tripCost: $tripCost ) {
      accepted
    }
  }
`;

export const AddFavoritePlace = gql`
  mutation AddFavoritePlace($favoritePlace: FavoritePlaceInput) {
    AddFavoritePlace(favoritePlace: $favoritePlace) {
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

/* #endregion */
