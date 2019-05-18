import gql from 'graphql-tag';

// QUERY SECTION
export const ClientProfile = gql`
  query ClientProfile {
    ClientProfile{
      id
      businessId
      name
      phone
      email
      active
      satelliteId
      favoritePlaces{
        id
        type
        name
        referenceName
        location{
          lat
          lng
        }
      }
    }
  }
`;

export const ClientLinkedSatellite = gql`
  query ClientLinkedSatellite($satelliteId: String!) {
    ClientLinkedSatellite(satelliteId: $satelliteId){
      businessId
      _id
      name
      phone
      documentId
      email
      city
      neighborhood
      addressLine1
      addressLine2
      zone
      active
      location{
        lat
        lng
      }
      tipType
      tip
      offerMinDistance
      offerMaxDistance
    }
  }
`;

// MUTATION SECTION
export const ValidateNewClient = gql`
  mutation ValidateNewClient {
    ValidateNewClient {
      clientId
      name
      username
    }
  }
`;

// SUBSCRIPTION SECTION
export const ClientWalletUpdates = gql`
  subscription ClientWalletUpdates($walletId: String!) {
    ClientWalletUpdates(walletId: $walletId) {
      _id
      documentId
      type
      fullname
      pockets {
        main
        bonus
      }
      spendingState
      businessId
    }
  }
`;
