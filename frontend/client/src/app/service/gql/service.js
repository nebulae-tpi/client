import gql from 'graphql-tag';

// QUERY
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

export const ValidateNewClient = gql`
  mutation ValidateNewClient {
    ValidateNewClient {
      clientId
      name
      username
    }
  }
`;
