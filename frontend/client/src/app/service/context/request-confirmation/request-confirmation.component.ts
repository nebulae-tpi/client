import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
    this.serviceService.publishServiceChanges({
      state: ServiceState.NO_SERVICE
    });
  }

  confirmService() {
    console.log('Actual propina: ', this.tipValue);
    if ((this.reference && this.reference !== '')
    ) {
      const pickUpMarker = {
        lat: this.serviceService.locationChange$.getValue().latitude,
        lng: this.serviceService.locationChange$.getValue().longitude
      };
      console.log('pickUpMarker: ', pickUpMarker);
      this.serviceService
        .createNewService$(
          this.serviceService.userProfile.username,
          pickUpMarker,
          this.currentAddress ? this.currentAddress : this.reference,
          this.reference,
          parseInt(this.tipValue, 10)
        )
        .subscribe(res => {
          console.log('Llega resultado: ', res);
        });
    } else {
      this.snackBar.open(
        'Por favor ingresar una referencia para el punto de recogida',
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
export class FilterSheet implements OnInit {
  imgVip = '../../../../assets/icons/context/icon_vip.png';
  imgAc = '../../../../assets/icons/context/icon_grill.png';
  imgGrill;
  imgTrunk;
  constructor(
    private bottomSheetRef: MatBottomSheetRef<FilterSheet>,
    private serviceService: ServiceService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.imgVip = this.findRequestFeature('VIP')
      ? '../../../../assets/icons/context/icon_vip_active.png'
      : '../../../../assets/icons/context/icon_vip.png';

    this.imgAc = this.findRequestFeature('AC')
      ? '../../../../assets/icons/context/icon_air_active.png'
      : '../../../../assets/icons/context/icon_air.png';

    this.imgGrill = this.findRequestFeature('ROOF_RACK')
      ? '../../../../assets/icons/context/icon_grill_active.png'
      : '../../../../assets/icons/context/icon_grill.png';

    this.imgTrunk = this.findRequestFeature('TRUNK')
      ? '../../../../assets/icons/context/icon_trunk_active.png'
      : '../../../../assets/icons/context/icon_trunk.png';

    this.cdRef.detectChanges();
  }

  openLink(event: MouseEvent): void {
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }

  enableDisableVip() {
    this.imgVip = this.addRemoveRequestFeature('VIP')
      ? '../../../../assets/icons/context/icon_vip_active.png'
      : '../../../../assets/icons/context/icon_vip.png';
    this.cdRef.detectChanges();
  }

  enableDisableAc() {
    this.imgAc = this.addRemoveRequestFeature('AC')
      ? '../../../../assets/icons/context/icon_air_active.png'
      : '../../../../assets/icons/context/icon_air.png';
    this.cdRef.detectChanges();
  }

  enableDisableGrill() {
    this.imgGrill = this.addRemoveRequestFeature('ROOF_RACK')
      ? '../../../../assets/icons/context/icon_grill_active.png'
      : '../../../../assets/icons/context/icon_grill.png';
    this.cdRef.detectChanges();
  }

  enableDisableTrunk() {
    this.imgTrunk = this.addRemoveRequestFeature('TRUNK')
      ? '../../../../assets/icons/context/icon_trunk_active.png'
      : '../../../../assets/icons/context/icon_trunk.png';
    this.cdRef.detectChanges();
  }

  private addRemoveRequestFeature(requestFeature) {
    let enabled = false;
    const currentService = this.serviceService.currentService$.getValue();
    if (!currentService.requestedFeatures) {
      currentService.requestedFeatures = [];
    }
    const found = currentService.requestedFeatures.findIndex(element => {
      return element === requestFeature;
    });
    if (found >= 0) {
      currentService.requestedFeatures.splice(found, 1);
    } else {
      enabled = true;
      currentService.requestedFeatures.push(requestFeature);
    }
    this.serviceService.publishServiceChanges(currentService);
    return enabled;
  }

  private findRequestFeature(requestFeature) {
    const currentService = this.serviceService.currentService$.getValue();
    if (!currentService.requestedFeatures) {
      currentService.requestedFeatures = [];
    }
    const found = currentService.requestedFeatures.findIndex(element => {
      return element === requestFeature;
    });

    return found >= 0;
  }
}
