import gql from 'graphql-tag';

// QUERY SECTION
export const HistoricalClientServices = gql`
  query HistoricalClientServices($year: Int, $month: Int, $page: Int, $count: Int) {
    HistoricalClientServices(year: $year, month: $month, page: $page, count: $count){
      _id
      timestamp
      vehicle{
        plate
      }
      driver{
        fullname
      }
      pickUp{
        marker{
          lat
          lng
        }
      }
      dropOff{
        marker{
          lat
          lng
        }
      }
      requestedFeatures
      paymentType
      fareDiscount
      fare
      tip
      state
      location{
        lat
        lng
      }
      # tripCost

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
  subscription ClientWalletUpdates {
    ClientWalletUpdates{
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


