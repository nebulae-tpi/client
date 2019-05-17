import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  Inject
} from '@angular/core';
import { SatelliteService } from '../satellite.service';
import {
  MatBottomSheetRef,
  MatSelectionList,
  MAT_BOTTOM_SHEET_DATA,
} from '@angular/material';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-cancel-client-sheet',
  templateUrl: 'cancel-sheet.component.html',
  styleUrls: ['./cancel-sheet.component.scss']
})
export class CancelClientSheetComponent implements OnInit, OnDestroy {
  @ViewChild(MatSelectionList) cancelationReasonList: MatSelectionList;

  relatedService: any;
  selectedOption;
  cancelReasonList = [
    {
      states: ['ASSIGNED', 'ARRIVED'],
      text: 'Placa no corresponde',
      value: 'PLATE_DOESNT_MATCH'
    },
    {
      states: ['ASSIGNED, ARRIVED'],
      text: 'No es el conductor',
      value: 'IS_NOT_THE_DRIVER'
    },
    {
      states: ['REQUESTED'],
      text: 'Se demora mucho',
      value: 'IT_TAKES_TOO_MUCH_TIME'
    },
    {
      states: ['REQUESTED'],
      text: 'Ya no se requiere',
      value: 'DOESNT_REQUIRED'
    }
  ];
  constructor(
    private bottomSheetRef: MatBottomSheetRef<CancelClientSheetComponent>,
    private satelliteService: SatelliteService,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any
  ) {
    this.relatedService = { state: data.state, id: data.id };
    console.log(this.relatedService);

  }

  openLink(event: MouseEvent): void {
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }

  onNgModelChange(cancelReason) {
    console.log('CANCEL SERVICE ==> ', cancelReason);
    this.satelliteService.cancelService$(this.relatedService.id, cancelReason)
    .pipe(
      tap(result => {
        console.log(result);
        this.bottomSheetRef.dismiss();
      })
    )
    .subscribe(res => console.log('Cancela servicio: ', res));

  }

  ngOnInit(): void {
    console.log('OnInit');
  }

  ngOnDestroy() {
    console.log('Ondestroy');
    this.bottomSheetRef.dismiss();
  }
}
