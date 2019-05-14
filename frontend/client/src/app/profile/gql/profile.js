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

export const ClientSatellites = gql`
  query ClientSatellites($filterText: String! ) {
    ClientSatellites(filterText: $filterText) {
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

/* #endregion */
