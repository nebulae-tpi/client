import gql from "graphql-tag";

// QUERY SECTION
export const ClientProfile = gql`
  query ClientProfile {
    ClientProfile {
      id
      businessId
      name
      phone
      email
      active
      satelliteId
      favoritePlaces {
        id
        type
        address
        name
        referenceName
        location {
          lat
          lng
        }
      }
    }
  }
`;

export const ClientLinkedSatellite = gql`
  query ClientLinkedSatellite($satelliteId: String!) {
    ClientLinkedSatellite(satelliteId: $satelliteId) {
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
      location {
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

export const ClientWallet = gql`
  query ClientWallet {
    ClientWallet {
      _id
      fullname
      documentId
      type
      pockets {
        main
        bonus
      }
      spendingState
      businessId
    }
  }
`;

// MUTATION SECTION
export const ValidateNewClient = gql`
  mutation ValidateNewClient($businessId: String) {
    ValidateNewClient(businessId: $businessId) {
      clientId
      name
      username
      updated
    }
  }
`;

// SUBSCRIPTION SECTION
export const ClientWalletUpdates = gql`
  subscription ClientWalletUpdates {
    ClientWalletUpdates {
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
