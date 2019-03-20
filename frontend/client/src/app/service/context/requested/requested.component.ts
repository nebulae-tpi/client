import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatBottomSheetRef, MatBottomSheet } from '@angular/material';
import { ServiceService } from '../../service.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-requested',
  templateUrl: './requested.component.html',
  styleUrls: ['./requested.component.scss']
})
export class RequestedComponent implements OnInit, OnDestroy {
  tipValue = '';
  currentService;
  private ngUnsubscribe = new Subject();
  constructor(private serviceService: ServiceService) {}

  ngOnInit() {
    this.serviceService.currentService$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(service => {
        this.currentService = service;
        this.tipValue = service && service.tip ? service.tip : '';
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
