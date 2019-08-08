import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { ServiceService } from '../../service.service';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-onboard',
  templateUrl: './onboard.component.html',
  styleUrls: ['./onboard.component.scss']
})
export class OnboardComponent implements OnInit, OnDestroy {
  currentService;
  private ngUnsubscribe = new Subject();
  constructor(private serviceService: ServiceService) {}

  ngOnInit() {
    this.serviceService.currentService$
      .pipe(
        distinctUntilChanged((a, b) => {
          const  diffVehicle = a.vehicle === b.vehicle;
          const  diffDriver = a.driver === b.driver;
          return diffVehicle && diffDriver;
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(service => {
        const { vehicle, driver, tip = '' } = service;
        this.currentService = { vehicle, driver, tip };
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
