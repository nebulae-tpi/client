import gql from "graphql-tag";

// MUTATIONS
export const IOERequestService = gql`
  mutation IOERequestService($client: IOEClientInput!, $pickUp: IOELocationInput!, $paymentType: String!, $requestedFeatures: [String], $dropOff: IOELocationInput, $dropOffSpecialType: String, $fareDiscount: Float, $fare: Int, $tip: Int, $request: RequestInput){
    IOERequestService(client: $client, pickUp: $pickUp, paymentType: $paymentType, requestedFeatures: $requestedFeatures, dropOff: $dropOff, dropOffSpecialType: $dropOffSpecialType, fareDiscount: $fareDiscount, fare: $fare, tip: $tip,  request: $request){
      accepted
    }
  }
`;

export const IOECancelService = gql`
  mutation IOECancelService($id: String!, $reason: String!, $authorType: String!, $notes: String){
    IOECancelService(id: $id, reason: $reason, authorType: $authorType, notes: $notes){
      accepted
    }
  }
`;

// QUERIES
export const IOEServices = gql`
query IOEServices($serviceStatesFilter: [String], $serviceChannelsFilter: [String], $viewAllOperators: Boolean, $businessId: String, $page: Int, $pageCount: Int, $monthsToAdd: Int ,$projections: [String]){
  IOEServices(serviceStatesFilter: $serviceStatesFilter, serviceChannelsFilter : $serviceChannelsFilter, viewAllOperators: $viewAllOperators, businessId: $businessId, page: $page, pageCount: $pageCount, monthsToAdd: $monthsToAdd, projections: $projections){
    id,
    closed,
    businessId,
    shiftId,
    timestamp,
    requestedFeatures,
    client{
      # this field cant be featched due at bug in apollo client https://github.com/apollographql/apollo-client/issues/3903
      # id, 
      businessId,
      fullname,
      username,
      tip,
      tipType,
      referrerDriverDocumentId,
      offerMinDistance,
      offerMaxDistance,
    },
    pickUp{
      marker{ lat, lng, timestamp },
      city,
      zone,
      neighborhood,
      addressLine1,
      addressLine2,
      notes
    },
    dropOffSpecialType,
      verificationCode,
      pickUpETA,
      dropOffpETA,
      paymentType,
      fareDiscount,
      fare,
      tip,
      route{ lat, lng, timestamp },
    state,
    stateChanges{ state, timestamp, location{ lat, lng, timestamp }, notes },
    location{ lat, lng, timestamp },
    vehicle{
      licensePlate
    },
    driver{ fullname, documentId, id },
    lastModificationTimestamp,
    request{
      sourceChannel, destChannel,
      creationOperatorId, creationOperatorUsername,
      ownerOperatorId, ownerOperatorUsername
    },
    offer{
      searchCount,
      offerCount,
      shifts,
      params{
        minDistance,
        maxDistance,
        offerTotalSpan,
        offerSearchSpan,
        offerShiftSpan
      }
    }
  }
}
`;

export const IOEShifts = gql`
query IOEShifts($shiftStatesFilter: [String], $businessId: String, $page: Int, $pageCount: Int, $monthsToAdd: Int $projections: [String]){
  IOEShifts(shiftStatesFilter: $shiftStatesFilter, businessId: $businessId, page: $page, pageCount: $pageCount, monthsToAdd: $monthsToAdd, projections: $projections){
    id,
    businessId,
    timestamp,            
    state,        
    online,
    lastReceivedComm,
    driver{ 
      fullname, 
      documentId, 
      id,
      username,
      wallet {
        pockets{
          main, bonus
        }
      }
    },
    vehicle{ id, licensePlate,features, brand,line, model },
    location{ lat, lng, timestamp },
  }
}
`;

// SUBSCRIPTION
export const IOEServiceSubscription = gql`
  subscription($businessId: String, $operatorId: String, $statesFilter: [String], $channelsFilter: [String]){
    IOEService(businessId: $businessId, operatorId: $operatorId, statesFilter: $statesFilter, channelsFilter: $channelsFilter ){
      id,
      closed,
        businessId,
        shiftId,
        timestamp,
        requestedFeatures,
        client{
          # id,
          businessId,
          fullname,
          username,
          tip,
          tipType,
          referrerDriverDocumentId,
          offerMinDistance,
          offerMaxDistance,
      },
      pickUp{
        marker{ lat, lng, timestamp },
        city,
          zone,
          neighborhood,
          addressLine1,
          addressLine2,
          notes
      },
      dropOffSpecialType,
        verificationCode,
        pickUpETA,
        dropOffpETA,
        paymentType,
        fareDiscount,
        fare,
        tip,
        route{ lat, lng, timestamp },
      state,
      stateChanges{ state, timestamp, location{ lat, lng, timestamp }, notes },
      location{ lat, lng, timestamp },
      vehicle{
        licensePlate
      },
      driver{ fullname, documentId, id },
      lastModificationTimestamp,
      request{
        sourceChannel, destChannel,
          creationOperatorId, creationOperatorUsername,
          ownerOperatorId, ownerOperatorUsername
      },
      offer{
        searchCount,
        offerCount,
        shifts,
        params{
          minDistance,
          maxDistance,
          offerTotalSpan,
          offerSearchSpan,
          offerShiftSpan
        }
      }
    }
  }
`;
export const IOEShiftSubscription = gql`
  subscription($businessId: String){
    IOEShift(businessId: $businessId){
      id,
      businessId,
      timestamp,            
      state,        
      online,
      lastReceivedComm,
      driver{ 
      fullname, 
      documentId, 
      id,
      username,
      wallet {
        pockets{
          main, bonus
        }
      }
      },
      vehicle{ id, licensePlate,features, brand,line, model },
      location{ lat, lng, timestamp },
    }
  }
`;
