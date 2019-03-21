import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { ServiceService } from '../../service.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-onboard',
  templateUrl: './onboard.component.html',
  styleUrls: ['./onboard.component.scss']
})
export class OnboardComponent implements OnInit, OnDestroy {
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
