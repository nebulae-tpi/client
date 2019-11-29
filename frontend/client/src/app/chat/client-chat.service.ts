import { Injectable } from '@angular/core';
import { GatewayService } from '../api/gateway.service';
import { SendMessageToDriver, ServiceMessageSubscription } from './gql/chatMessage.js';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientChatService {
  constructor(private gateway: GatewayService) { }
  public messageList = new BehaviorSubject([]);

  sendMessageToDriver$(serviceId, message) {
    return this.gateway.apollo.mutate<any>({
      mutation: SendMessageToDriver,
      variables: {
        serviceId,
        message
      },
      errorPolicy: 'all'
    });
  }

  listenNewChatMessages$() {
    return this.gateway.apollo.subscribe({
      query: ServiceMessageSubscription
    });
  }
}
