import { Component, OnInit, OnDestroy } from '@angular/core';
import { ServiceService } from '../../service.service';
import { Subject, of, interval } from 'rxjs';
import { takeUntil, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatBottomSheet } from '@angular/material';
import { CancelSheetComponent } from '../../location/location.component';

@Component({
  selector: 'app-assigned',
  templateUrl: './assigned.component.html',
  styleUrls: ['./assigned.component.scss']
})
export class AssignedComponent implements OnInit, OnDestroy {

  currentService;
  showHeader = true;
  fxFlexTip = 40;
  fxFlexPlate = 40;
  pickUpETA = 0;
  timeoutEta;

  private ngUnsubscribe = new Subject();
  constructor(
    private serviceService: ServiceService,
    private bottomSheet: MatBottomSheet
  ) { }

  ngOnInit() {

    this.listenServiceChanges();
    this.updatePickupEta();
    this.listenLayoutCommands();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    if (this.timeoutEta) {
      clearTimeout(this.timeoutEta);
    }
  }

  openCancelSheet() {
    this.bottomSheet.open(CancelSheetComponent);
  }

  updatePickupEta() {
    interval(5000)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(val => {
        this.getPickUpETA();
      });
  }

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(
        distinctUntilChanged((a, b) => {
          const diffState = a.state === b.state;
          const diffPickUp = a.pickUp === b.pickUp;
          const diffDriver = a.driver === b.driver;
          return diffState && diffPickUp && diffDriver;
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(service => {
        const { state, pickUp, driver, vehicle, tip = '' } = service;
        this.currentService = { state, pickUp, driver, vehicle, tip };
        this.getPickUpETA();
      });
  }

  getPickUpETA() {
    let pickUpEtaMin = Math.floor( (this.currentService.pickUpETA - new Date().getTime()) / 60000 );
    if (pickUpEtaMin <= 0 || isNaN(pickUpEtaMin)) {
      pickUpEtaMin = 1;
    }
    this.pickUpETA = pickUpEtaMin;
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
