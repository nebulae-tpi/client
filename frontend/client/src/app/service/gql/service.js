import gql from 'graphql-tag';

/* #region  QUERY */
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

export const CurrentServices = gql`
  query CurrentServices {
    CurrentServices {
      _id
      timestamp
      vehicle {
        plate
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
      state
    }
  }
`;
/* #endregion */

/* #region  MUTATION */

export const ValidateNewClient = gql`
  mutation ValidateNewClient {
    ValidateNewClient {
      clientId
      name
      username
    }
  }
`;

export const CancelServiceByClient = gql`
  mutation CancelServiceByClient($id: String!, $reason: String!, $notes: String){
  CancelServiceByClient(id: $id, reason: $reason, notes: $notes){
    accepted
  }
}
`;

export const RequestService = gql`
  mutation RequestService(
    $client: ClientInput!
    $pickUp: LocationInput!
    $paymentType: String!
    $requestedFeatures: [String]
    $dropOff: LocationInput
    $tip: Int
  ) {
    RequestService(
      client: $client
      pickUp: $pickUp
      paymentType: $paymentType
      requestedFeatures: $requestedFeatures
      dropOff: $dropOff
      tip: $tip
    ) {
      accepted
    }
  }
`;

/* #endregion */
