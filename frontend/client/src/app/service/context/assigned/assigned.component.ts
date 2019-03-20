import { Component, OnInit, OnDestroy } from '@angular/core';
import { ServiceService } from '../../service.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
  private ngUnsubscribe = new Subject();
  constructor(private serviceService: ServiceService, private bottomSheet: MatBottomSheet) {}

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

  openCancelSheet() {
    this.bottomSheet.open(CancelSheet);
  }
}
