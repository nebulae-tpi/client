import gql from "graphql-tag";

// MUTATIONS
export const RequestService = gql`
  mutation RequestService(
    $client: ClientInput
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

export const CancelServiceByClient = gql`
  mutation CancelServiceByClient(
    $id: String!
    $reason: String!
    $notes: String
  ) {
    CancelServiceByClient(id: $id, reason: $reason, notes: $notes) {
      accepted
    }
  }
`;

// QUERIES
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

export const IOEShifts = gql`
  query IOEShifts(
    $shiftStatesFilter: [String]
    $businessId: String
    $page: Int
    $pageCount: Int
    $monthsToAdd: Int
    $projections: [String]
  ) {
    IOEShifts(
      shiftStatesFilter: $shiftStatesFilter
      businessId: $businessId
      page: $page
      pageCount: $pageCount
      monthsToAdd: $monthsToAdd
      projections: $projections
    ) {
      id
      businessId
      timestamp
      state
      online
      lastReceivedComm
      driver {
        fullname
        documentId
        id
        username
        wallet {
          pockets {
            main
            bonus
          }
        }
      }
      vehicle {
        id
        licensePlate
        features
        brand
        line
        model
      }
      location {
        lat
        lng
        timestamp
      }
    }
  }
`;

// SUBSCRIPTION
// export const IOEServiceSubscription = gql`
//   subscription($businessId: String, $operatorId: String, $statesFilter: [String], $channelsFilter: [String]){
//     IOEService(businessId: $businessId, operatorId: $operatorId, statesFilter: $statesFilter, channelsFilter: $channelsFilter ){
//       id,
//       closed,
//         businessId,
//         shiftId,
//         timestamp,
//         requestedFeatures,
//         client{
//           # id,
//           businessId,
//           fullname,
//           username,
//           tip,
//           tipType,
//           referrerDriverDocumentId,
//           offerMinDistance,
//           offerMaxDistance,
//       },
//       pickUp{
//         marker{ lat, lng, timestamp },
//         city,
//           zone,
//           neighborhood,
//           addressLine1,
//           addressLine2,
//           notes
//       },
//       dropOffSpecialType,
//         verificationCode,
//         pickUpETA,
//         dropOffpETA,
//         paymentType,
//         fareDiscount,
//         fare,
//         tip,
//         route{ lat, lng, timestamp },
//       state,
//       stateChanges{ state, timestamp, location{ lat, lng, timestamp }, notes },
//       location{ lat, lng, timestamp },
//       vehicle{
//         licensePlate
//       },
//       driver{ fullname, documentId, id },
//       lastModificationTimestamp,
//       request{
//         sourceChannel, destChannel,
//           creationOperatorId, creationOperatorUsername,
//           ownerOperatorId, ownerOperatorUsername
//       },
//       offer{
//         searchCount,
//         offerCount,
//         shifts,
//         params{
//           minDistance,
//           maxDistance,
//           offerTotalSpan,
//           offerSearchSpan,
//           offerShiftSpan
//         }
//       }
//     }
//   }
// `;

export const ClientServiceUpdatedSubscription = gql`
  subscription ClientServiceUpdatedSubscription {
    ClientServiceUpdatedSubscription {
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
      pickUpETA
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
    }
  }
`;
