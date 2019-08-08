import { Component, OnInit, OnDestroy } from '@angular/core';
import { ServiceService } from '../service.service';
import { takeUntil, distinctUntilChanged, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-context',
  templateUrl: './context.component.html',
  styleUrls: ['./context.component.scss']
})
export class ContextComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  serviceState = null;

  constructor(private serviceService: ServiceService) {}
  ngOnInit() {
    this.listenServiceChanges();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(
        filter((service: any) => service),
        distinctUntilChanged((a, b) => a.state === b.state ),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((service: any) => {
        if (service) {
          this.serviceState = service.state;
        }
      });
  }


}
