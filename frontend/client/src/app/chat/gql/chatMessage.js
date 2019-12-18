import gql from "graphql-tag";

export const SendMessageToDriver = gql`
  mutation SendMessageToDriver($serviceId: String!, $message: ChatMessageInput!) {
    SendMessageToDriver(serviceId: $serviceId, message: $message){
      accepted
    }
  }
`;

export const ServiceMessageSubscription = gql`
  subscription ServiceMessageSubscription {
    ServiceMessageSubscription{
      from
      message{
        textMessage
      }
    }
  }
`;
