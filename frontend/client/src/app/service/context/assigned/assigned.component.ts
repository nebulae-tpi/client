import { Component, OnInit, OnDestroy } from '@angular/core';
import { ServiceService } from '../../service.service';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { MatBottomSheet } from '@angular/material';
import { CancelSheet } from '../../location/location.component';

@Component({
  selector: 'app-assigned',
  templateUrl: './assigned.component.html',
  styleUrls: ['./assigned.component.scss']
})
export class AssignedComponent implements OnInit, OnDestroy {
  tipValue = '';
  currentService;
  showHeader = true;
  fxFlexTip = 40;
  fxFlexPlate = 40;
  private ngUnsubscribe = new Subject();
  constructor(private serviceService: ServiceService, private bottomSheet: MatBottomSheet) {}

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

  openCancelSheet() {
    this.bottomSheet.open(CancelSheet);
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
            this.fxFlexPlate = 100;
            this.showHeader = false;
          } else {
            this.fxFlexTip = 40;
            this.fxFlexPlate = 40;
            this.showHeader = true;
          }
        }
      });
  }
}
