import gql from "graphql-tag";

/* #region  QUERY */
export const BusinessContactInfo = gql`
  query BusinessContactInfo {
    BusinessContactInfo {
      name
      whatsapp
      phone
      businessId
    }
  }
`;

export const linkSatellite = gql`
  mutation linkSatellite($satelliteId: String) {
    linkSatellite(satelliteId: $satelliteId) {
      code
      message
    }
  }
`;

export const unlinkSatellite = gql`
  mutation unlinkSatellite {
    unlinkSatellite {
      code
      message
    }
  }
`;

export const getBusinesses = gql`
  query getBusinesses($page: Int!, $count: Int!, $filterText: String, $sortColumn: String, $sortOrder: String){
  getBusinesses(page: $page, count: $count, filter: $filterText, sortColumn: $sortColumn, sortOrder: $sortOrder){
    _id
    generalInfo {
      name
    }
    state
  }
}
`;

export const ClientSatellites = gql`
  query ClientSatellites($filterText: String!, $businessId: String) {
    ClientSatellites(filterText: $filterText, businessId: $businessId) {
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
    }
  }
`;

export const RemoveFavoritePlace = gql`
  mutation RemoveFavoritePlace($id: String, $name: String) {
    RemoveFavoritePlace(id: $id, name: $name ) {
      code
      message
    }
  }
`;



/* #endregion */
