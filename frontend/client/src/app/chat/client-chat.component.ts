import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  map,
  tap,
  filter,
  mergeMap,
  takeUntil
} from 'rxjs/operators';
import { Subject, forkJoin, of, } from 'rxjs';
import { MenuService } from 'src/app/menu/menu.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { ClientChatService } from './client-chat.service';
import { ServiceService } from '../service/service.service';

@Component({
  selector: 'client-chat',
  templateUrl: './client-chat.component.html',
  styleUrls: ['./client-chat.component.css']
})
export class ClientChatComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  public textMessage: String;
  public messageList = [];
  constructor(
    private menuService: MenuService,
    private clientChatService: ClientChatService,
    private serviceService: ServiceService,
    private location: Location,
    private router: Router,
    private snackBar: MatSnackBar,

  ) { }

  ngOnInit() {
    this.clientChatService.messageList.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(messageList => {
      this.messageList = messageList;
    }
    );
    this.clientChatService.listenNewChatMessages$().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(newMessage => {
      const wrapMessage = newMessage.data.ServiceMessageSubscription;
      const tempData = this.clientChatService.messageList.getValue();
      console.log('wrapMessage.textMessage: ' + wrapMessage.message.textMessage);
      tempData.push({ from: 'Conductor', message: wrapMessage.message.textMessage, timestamp: Date.now() });
      this.clientChatService.messageList.next(tempData);
      this.textMessage = '';
    }
    );
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
  }


  backClicked() {
    this.location.back();
  }


  showSnackMessage(message, timeout = 3000) {
    this.snackBar.open(message, 'Cerrar', {
      duration: timeout
    });
  }

  sendMessage() {
    this.clientChatService.sendMessageToDriver$(this.serviceService.currentService$.getValue()._id,
      { textMessage: this.textMessage }).subscribe(result => {
        const tempData = this.clientChatService.messageList.getValue();
        tempData.push({ from: 'me', message: this.textMessage, timestamp: Date.now() });
        this.clientChatService.messageList.next(tempData);
        this.textMessage = '';
      }
      );
  }

}
