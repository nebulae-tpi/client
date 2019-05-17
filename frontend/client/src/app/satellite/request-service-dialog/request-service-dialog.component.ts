////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Inject
} from '@angular/core';

import { FormGroup, FormControl, Validators } from '@angular/forms';

////////// RXJS ///////////
import { map, mergeMap, filter, tap, takeUntil, toArray } from 'rxjs/operators';

import { Subject, of, range } from 'rxjs';

////////// ANGULAR MATERIAL //////////
import { MatSnackBar, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

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

  // // tslint:disable-next-line: variable-name
  //   _my_tip = 1000;
  // // tslint:disable-next-line: variable-name
  //   _my_tip_type = 'CASH';
  // // tslint:disable-next-line: variable-name
  //   _userProfileId = 'q1w2e3-r4t5y6-u7i8o9';
  // // tslint:disable-next-line: variable-name
  //   _client = {
  //     _id: 'q1w2-e3r4-e3w2-3e4r',
  //     name: 'cateddral',
  //     addressLine1: '',
  //     addressLine2: '',
  //     location: {
  //       lat: 1,
  //       lng: 23
  //     },
  //     tip: 700,
  //     tipType: 'CASH'
  //   };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private satelliteService: SatelliteService,
    private dialogRef: MatDialogRef<RequestServiceDialogComponent>
  ) {}

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
    this.form = new FormGroup(
      {
        clientName: new FormControl(null),
        quantity: new FormControl(1, [Validators.min(1), Validators.max(5)]),
        featureOptionsGroup: new FormControl([]),
        destinationOptionsGroup: new FormControl('DEFAULT'),
        clientTip: new FormControl(0)
      }
      // [this.validateFormAcordingType.bind(this)]
    );
  }

  submit(event?) {
    of(event)
    .pipe(
      map(() => {
        this.form.patchValue({});
        const rawRequest = { ...this.form.getRawValue(), client: this.data.client };
        rawRequest.tip = rawRequest.clientTip;
        rawRequest.fareDiscount = 0;
        return rawRequest;
      }),
      mergeMap(request => this.requestService$(request)),
      toArray(),
      tap((result: any) => {

        const responses: any[] = result.map(r => (((r || {}).data || {}).RequestService || {}).accepted || false);

        const succesResponse = responses.includes(true);
        if ( succesResponse ) {
          this.showMessageSnackbar('Solicitud Realizada con Éxito');
          this.dialogRef.close(true);
        } else {
          this.dialogRef.close();
        }
      }),

    ).subscribe(() => {}, e => console.log(e), () => {});

  }

  /**
   * Send the request service command to the server
   */
  requestService$({
    client,
    destinationOptionsGroup,
    featureOptionsGroup,
    quantity,
    paymentType = 'CASH',
    tip,
    fare,
    fareDiscount
  }) {
    return range(1, quantity || 1)
      .pipe(
        filter(() => client && this.data.user),
        map(requestNumber => ({
          client: {
            id: client._id,
            fullname: client.name.toUpperCase(),
            username: client.auth ? client.auth.username : null, // todo
            tip: client.tip,
            tipType: client.tipType,
            tipClientId: this.data.user.satelliteOwner || this.data.user.id,
            referrerDriverDocumentId: client.referrerDriverDocumentId || null,
            offerMinDistance: client.offerMinDistance || null,
            offerMaxDistance: client.offerMaxDistance || null
          },
          pickUp: {
            marker: {
              lat: client.location.lat,
              lng: client.location.lng
            },
            polygon: null,
            city: client.city,
            zone: client.zone,
            neighborhood: client.neighborhood,
            addressLine1: client.addressLine1,
            addressLine2: client.addressLine2,
            notes: client.notes // todo
          },
          paymentType,
          requestedFeatures: featureOptionsGroup,
          dropOff: null,
          // dropOffSpecialType: destinationOptionsGroup,
          // fareDiscount,
          fare,
          tip
          // request: {
          //   sourceChannel: 'OPERATOR',
          //   destChannel: 'DRIVER_APP'
          // }
        })),
        tap(rqst => console.log('Enviando REQUEST ==> ', rqst)),
        mergeMap(clientRequest => this.satelliteService.requestService$(clientRequest)),
        takeUntil(this.ngUnsubscribe)
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
            this.showMessageSnackbar(
              'ERRORS.' + ((error.extensions || {}).code || 1)
            );
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
  showMessageSnackbar(msg) {
    console.log('showMessageSnackbar ===> ', msg);
    this.snackBar.open(msg, '', { duration: 3000 }
    );
  }

  //#endregion

  //#region HOT-KEYS

  toggleFeatureOption(feauture) {
    const currentSelection: string[] =
      this.form.getRawValue().featureOptionsGroup || [];
    const featIndex = currentSelection.indexOf(feauture);
    if (featIndex === -1) {
      currentSelection.push(feauture);
    } else {
      currentSelection.splice(featIndex, 1);
    }
    this.form.patchValue({ featureOptionsGroup: currentSelection });
  }

  addQuantity(quantityaddition) {
    let newQuantity = this.form.get('quantity').value + quantityaddition;
    newQuantity =
      newQuantity === 6 && quantityaddition === 1
        ? 1
        : newQuantity === 0 && quantityaddition === -1
        ? 5
        : newQuantity;

    this.form.patchValue({ quantity: newQuantity });
  }

  selectSpecialDestinationOption(specialDest) {
    this.form.patchValue({ destinationOptionsGroup: specialDest });
  }
  //#endregion
}
