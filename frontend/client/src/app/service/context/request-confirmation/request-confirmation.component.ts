import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  MatIconRegistry,
  MatBottomSheet,
  MatBottomSheetRef
} from '@angular/material';
import { ServiceService } from '../../service.service';
import { ServiceState } from '../../service-state';
import { filter, takeUntil, map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-request-confirmation',
  templateUrl: './request-confirmation.component.html',
  styleUrls: ['./request-confirmation.component.scss']
})
export class RequestConfirmationComponent implements OnInit, OnDestroy {
  tipValue = '0';
  reference = '';
  currentAddress = '';
  private ngUnsubscribe = new Subject();
  constructor(
    private bottomSheet: MatBottomSheet,
    private serviceService: ServiceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.listenAddressChanges();
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  openBottomSheet(): void {
    this.bottomSheet.open(FilterSheet);
  }

  cancel() {
    this.serviceService.currentService$.next({
      state: ServiceState.NO_SERVICE
    });
  }

  confirmService() {
    if ((this.currentAddress && this.currentAddress !== '') || (this.reference && this.reference !== '')) {
      this.serviceService.currentService$.next({
        state: ServiceState.REQUESTED,
        pickup: { location: { marker: { lat: 6.161758, lng: -75.603301 } } }
      });
    } else {
      this.snackBar.open(
        'Por favor dar una dirección o referencia para el punto de recogida',
        'Cerrar',
        {
          duration: 2000
        }
      );
    }
  }

  listenAddressChanges() {
    this.serviceService.addressChange$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(address => {
        this.currentAddress = address;
      });
  }
}

@Component({
  selector: 'app-filter-sheet',
  templateUrl: 'filter-sheet.html',
  styleUrls: ['./request-confirmation.component.scss']
})
export class FilterSheet {
  constructor(
    private bottomSheetRef: MatBottomSheetRef<FilterSheet>,
    private serviceService: ServiceService
  ) {}

  openLink(event: MouseEvent): void {
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }
}
