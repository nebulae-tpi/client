import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatBottomSheetRef, MatBottomSheet } from '@angular/material';
import { ServiceService } from '../../service.service';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

@Component({
  selector: 'app-requested',
  templateUrl: './requested.component.html',
  styleUrls: ['./requested.component.scss']
})
export class RequestedComponent implements OnInit, OnDestroy {
  tipValue = '';
  currentService;
  fxFlexTip = 40;
  fxFlexFilter = 40;
  showHeader = true;
  private ngUnsubscribe = new Subject();
  constructor(private serviceService: ServiceService) {}

  ngOnInit() {
    this.serviceService.currentService$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(service => {
        this.currentService = service;
        this.tipValue = service && service.tip ? service.tip : '';
      });
    this.listenLayoutCommands();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  listenLayoutCommands() {
    this.serviceService.layoutChanges$
      .pipe(
        filter(e => e && e.layout),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(command => {
        if (command && command.layout) {
          if (
            command.layout.type === 0 ||
            command.layout.type === 1 ||
            command.layout.type === 4 ||
            command.layout.type === 5
          ) {
            this.fxFlexTip = 100;
            this.fxFlexFilter = 100;
            this.showHeader = false;
          } else {
            this.fxFlexTip = 40;
            this.fxFlexFilter = 40;
            this.showHeader = true;
          }
        }
      });
  }
}
