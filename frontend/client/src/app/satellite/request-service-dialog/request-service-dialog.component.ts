////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Inject,
} from '@angular/core';

import {
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';

////////// RXJS ///////////
import {
  map,
  mergeMap,
  filter,
  tap,
  takeUntil,
} from 'rxjs/operators';

import { Subject, of, range } from 'rxjs';

////////// ANGULAR MATERIAL //////////
import {
  MatSnackBar,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material';



//////////// Other Services ////////////
import { SatelliteService } from '../satellite.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'request-service-dialog',
  templateUrl: './request-service-dialog.component.html',
  styleUrls: ['./request-service-dialog.component.scss'],
  providers: []
})
export class RequestServiceDialogComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();
  // Main form group
  form: FormGroup;
  // hotkeys: Hotkey[] = [];
  clientDefaultTip = 0;

  doorMenOptions: any[];

  // searchElementRef: ElementRef;
  @ViewChild('addressAutocomplete') addressAutocomplete: ElementRef;

  _my_tip = 1000;
  _my_tip_type = 'CASH';
  _userProfileId = 'q1w2e3-r4t5y6-u7i8o9';
  _client = {
    _id: 'q1w2-e3r4-e3w2-3e4r',
    name: 'cateddral',
    addressLine1: '',
    addressLine2: '',
    location:{
      lat: 1,
      lng: 23
    },
    tip: 700,
    tipType: 'CASH'
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private satelliteService: SatelliteService,
    private dialogRef: MatDialogRef<RequestServiceDialogComponent>
  ) {
  }



  ngOnInit() {
    this.buildRequesServiceForm();
  }

 

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }


  /**
   * Builds request service form
   */
  buildRequesServiceForm() {
    // Reactive Filter Form
    this.form = new FormGroup({
      clientGoogleAdress: new FormControl(null),
      // clientAddress: new FormControl(null),
      clientLocationRef: new FormControl(null),
      clientName: new FormControl(null),
      quantity: new FormControl(1, [Validators.min(1), Validators.max(5)]),
      featureOptionsGroup: new FormControl([]),
      destinationOptionsGroup: new FormControl('DEFAULT'),
      clientTip: new FormControl(0)
    },
      // [this.validateFormAcordingType.bind(this)]
    );
  }



  submit(event?) {
    this.form.patchValue({  });
    let rawRequest = {
      ...this.form.getRawValue()
    };
    if (this.data.type === 1){
      rawRequest = {...rawRequest,
        client: {
          _id: this._client._id,
          generalInfo: {
            name: this._client.name.toUpperCase(),
            addressLine1: this._client.addressLine1,
            addressLine2: this._client.addressLine2,
          },
          location: {
            lat: this._client.location.lat,
            lng: this._client.location.lng
          }
        },
        fareDiscount: 0.1,
        tip: rawRequest.clientTip
      };
    }
    this.requestService(rawRequest);
    this.dialogRef.close();
  }

  /**
   * Send the request service command to the server
   */
  requestService({ client, destinationOptionsGroup, featureOptionsGroup, quantity, paymentType = 'CASH', tip, fare, fareDiscount }) {
    return range(1, quantity || 1)
      .pipe(
        filter(() => (this.data.type === 0 && client != null) || ( this.data.type === 1 )),
        map(requestNumber => ({
          client: {
            id: client._id,
            fullname: client.generalInfo.name,
            username: client.auth ? client.auth.username : null,
            tip : this._my_tip,
            tipType: this._my_tip_type,
            tipClientId: this._userProfileId,
            referrerDriverDocumentId: client.satelliteInfo ? client.satelliteInfo.referrerDriverDocumentId : null,
            offerMinDistance: client.satelliteInfo ? client.satelliteInfo.offerMinDistance : null,
            offerMaxDistance: client.satelliteInfo ? client.satelliteInfo.offerMaxDistance : null,
          },
          pickUp: {
            marker: {
              lat: client.location.lat,
              lng: client.location.lng,
            },
            polygon: null,
            city: client.generalInfo.city,
            zone: client.generalInfo.zone,
            neighborhood: client.generalInfo.neighborhood,
            addressLine1: client.generalInfo.addressLine1,
            addressLine2: client.generalInfo.addressLine2,
            notes: client.generalInfo.notes
          },
          paymentType,
          requestedFeatures: featureOptionsGroup,
          dropOff: null,
          // dropOffSpecialType: destinationOptionsGroup,
          fareDiscount,
          fare,
          tip,
          request: {
            sourceChannel: 'OPERATOR',
            destChannel: 'DRIVER_APP',
          }
        })),
        tap(rqst => console.log('Enviando REQUEST ==> ', JSON.stringify(rqst))),
        mergeMap(ioeRequest => this.satelliteService.requestService$(ioeRequest)),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(
        (result: any) => {
          if (result.data && result.data.IOERequestService && result.data.IOERequestService.accepted) {
            this.showMessageSnackbar('SERVICES.REQUEST_SERVICE_SUCCESS');
          }
        },
        error => {
          this.showMessageSnackbar('SERVICES.ERROR_OPERATION');
          console.log('Error ==> ', error);
        }
      );
  }

  // validateFormAcordingType(form: FormGroup){
  //   const rawValue = form.getRawValue();
  //   if (this.data.type === 1){
  //     // if (!rawValue.clientGoogleAdress){
  //     //   return { missingGoogleLocation: true };
  //     // }
  //     // if (!rawValue.clientGoogleAdress){
  //     //   return { missingGoogleLocation: true };
  //     // }
  //   }
  //   return null;
  // }



  //#region TOOLS - ERRORS HANDLERS - SNACKBAR

  graphQlAlarmsErrorHandler$(response) {
    return of(JSON.parse(JSON.stringify(response))).pipe(
      tap((resp: any) => {
        if (response && Array.isArray(response.errors)) {
          response.errors.forEach(error => {
            this.showMessageSnackbar('ERRORS.' + ((error.extensions || {}).code || 1) );
          });
        }
        return resp;
      })
    );
  }


  /**
   * Shows a message snackbar on the bottom of the page
   * @param messageKey Key of the message to i18n
   * @param detailMessageKey Key of the detail message to i18n
   */
  showMessageSnackbar(messageKey, detailMessageKey?) {
    const translationData = [];
    if (messageKey) {
      translationData.push(messageKey);
    }

    if (detailMessageKey) {
      translationData.push(detailMessageKey);
    }

    // this.translate.get(translationData).subscribe(data => {
    //   this.snackBar.open(
    //     messageKey ? data[messageKey] : '',
    //     detailMessageKey ? data[detailMessageKey] : '',
    //     {
    //       duration: 2000
    //     }
    //   );
    // });

  }

  //#endregion

  //#region HOT-KEYS

  toggleFeatureOption(feauture) {
    const currentSelection: String[] = this.form.getRawValue().featureOptionsGroup || [];
    const featIndex = currentSelection.indexOf(feauture);
    if (featIndex === -1) { currentSelection.push(feauture); } else { currentSelection.splice(featIndex, 1); }
    this.form.patchValue({ featureOptionsGroup: currentSelection });
  }

  addQuantity(quantityaddition) {
    let newQuantity = this.form.get('quantity').value + quantityaddition;
    newQuantity = (newQuantity === 6 && quantityaddition === 1)
      ? 1
      : (newQuantity === 0 && quantityaddition === -1) ? 5 : newQuantity;


    this.form.patchValue({ quantity: newQuantity });
  }

  selectSpecialDestinationOption(specialDest) {
    this.form.patchValue({ destinationOptionsGroup: specialDest });
  }
  //#endregion

}
