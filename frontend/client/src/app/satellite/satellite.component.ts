import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { MenuService } from '../menu/menu.service';
import { combineLatest, of, timer, forkJoin, from, Subject } from 'rxjs';
import { tap, map, mergeMap, takeUntil, toArray, filter } from 'rxjs/operators';
import { MatDialogConfig, MatDialogRef, MatDialog, MatSnackBar, MatBottomSheet } from '@angular/material';
import { RequestServiceDialogComponent } from './request-service-dialog/request-service-dialog.component';
import { SatelliteService } from './satellite.service';
import { CancelClientSheetComponent } from './cancel-sheet/cancel-sheet.component';

@Component({
  selector: 'app-satellite',
  templateUrl: './satellite.component.html',
  styleUrls: ['./satellite.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SatelliteComponent implements OnInit, OnDestroy {

  userProfile: any;
  linkedSatellite: any;

  private ngUnsubscribe = new Subject();
  // offer span in seconds
  offerSpan = 120;
  // delay Threshold
  delayThreshold = 60000 * 5; // five minutes
  selectedServiceId: string;
  // used to togle background and font color
  toggleState = false;
  // DATA TABLE
  partialData = [];
  displayedColumns = [
    'state',
    'creation_timestamp',
    'vehicle_plate',
    'eta',
    'actions'
  ];

  SERVICES_STATES = {
    REQUESTED: 'Solicitado',
    ASSIGNED: 'Asignado',
    ON_BOARD: 'A Bordo',
    ARRIVED: 'Ha llegado',
    DONE: 'Completado',
    CLOSED: 'Cerrado',
    CANCELLED_OPERATOR: 'Can. Oper',
    CANCELLED_DRIVER: 'Can. Cond',
    CANCELLED_CLIENT: 'Can. Clien',
    CANCELLED_SYSTEM: 'Can. Sys'
  };

  private requestServiceDialogRef: MatDialogRef<RequestServiceDialogComponent> = undefined;

  constructor(
    private menuService: MenuService,
    private satelliteService: SatelliteService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private bottomSheet: MatBottomSheet
  ) {}

  ngOnInit() {
    this.listenSatelliteAndUserProfile();
    this.loadPartialData();
    this.registerTimer();
    this.listenServicesUpdates();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  loadPartialData() {
    this.satelliteService.queryServices$()
      .pipe(
        map((response: any) => ((response || {}).data || {}).CurrentServices || []),
        tap(serviceList => {
          console.log('CURRENT SERVICES ==> ', serviceList);
          this.partialData = serviceList.map(s => this.convertServiceToTableFormat(s) );
        })
      )
      .subscribe();
  }

  registerTimer() {
    timer(5000, 1000)
      .pipe(
        mergeMap(() =>
          forkJoin(
            this.refreshTimeRelatedPartialData(),
            this.updateStylesVariablesForPartialData$()
          )
        ),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(
        () => {},
        error => console.error(`DatatableComponent.registerTimer: Error => ${JSON.stringify(error)}`),
        () => { console.log(`DatatableComponent.registerTimer: Completed`); }
      );
  }

  //#region TIME-RELATED DATE REFRESH
  refreshTimeRelatedPartialData() {
    return from(this.partialData).pipe(
      tap(pd => {
        pd.state_time_span = this.calcServiceStateTimeSpan(pd.serviceRef);
        pd.eta = this.calculateServiceEta(pd.serviceRef);
      })
    );
  }

  updateStylesVariablesForPartialData$() {
    this.toggleState = !this.toggleState;
    return from(this.partialData).pipe(
      tap(service => {
        const offerSpanPercentage = Math.floor((Date.now() - service.lastStateChangeTimeStamp) / 10 / this.offerSpan);
        // (50 *100)/200 ==> 25%
        // (quiantity*100)/total = %

        switch (service.state) {
          case 'REQUESTED':
            if (offerSpanPercentage < 50) {
              service.style = {
                state: { bgColor: 'yellow', fontColor: 'black' },
                tTrans: { fontColor: 'black' }
              };
            } else if (offerSpanPercentage > 50) {
              service.style = {
                state: {
                  bgColor: this.toggleState ? 'yellow' : 'white',
                  fontColor: this.toggleState ? 'red' : 'black',
                  fontBold: true
                },
                tTrans: { fontColor: 'red' }
              };
            }
            break;

          case 'CANCELLED_SYSTEM':
            if (offerSpanPercentage < 25) {
              // APROX 30 seconds
              service.style = {
                state: {
                  bgColor: this.toggleState ? 'red' : 'white',
                  fontColor: this.toggleState ? 'black' : 'red',
                  fontBold: true
                },
                tTrans: { fontColor: 'red' }
              };
            } else {
              service.style = {
                state: { bgColor: 'white', fontColor: 'red' },
                tTrans: {}
              };
            }
            break;

          case 'ASSIGNED':
            const etaTime = service.serviceRef.pickUpETA;
            if (!etaTime || (etaTime && Date.now() < etaTime)) {
              service.style = {
                state: { bgColor: 'green', fontColor: 'black' },
                tTrans: {}
              };
            } else if (etaTime && Date.now() < etaTime + this.delayThreshold) {
              service.style = {
                state: { bgColor: 'red', fontColor: 'black' },
                tTrans: {}
              };
            } else if (etaTime && Date.now() > etaTime + this.delayThreshold) {
              service.style = {
                state: {
                  bgColor: this.toggleState ? 'red' : 'white',
                  fontColor: this.toggleState ? 'black' : 'red',
                  fontBold: true
                },
                tTrans: {}
              };
            }
            break;

          case 'CANCELLED_OPERATOR':
            service.style = {
              state: { bgColor: 'white', fontColor: 'red' },
              tTrans: {}
            };
            break;

          case 'CANCELLED_DRIVER':
            service.style = {
              state: { bgColor: 'white', fontColor: 'red' },
              tTrans: {}
            };
            break;
          case 'CANCELLED_CLIENT':
            service.style = {
              state: { bgColor: 'white', fontColor: 'red' },
              tTrans: {}
            };
            break;

          default:
            service.style = { state: {}, tTrans: {} };
            break;
        }
      }),
      toArray(),
      tap(() => this.partialData = [...this.partialData])
    );
  }

  calcServiceStateTimeSpan(service) {
    const latestState = service.stateChanges
      ? service.stateChanges.filter(pds => pds.state === service.state).pop()
      : undefined;
    if (latestState) {
      const diff = Date.now() - latestState.timestamp;
      const minutes = Math.floor(diff / 60000);
      const seconds = ((diff % 60000) / 1000).toFixed(0);
      return `${minutes > 9 ? minutes : '0' + minutes}m${
        seconds.length > 1 ? seconds : '0' + seconds
      }s`;
    } else {
      return '---';
    }
  }

  calculateServiceEta(service) {
    if (!service.pickUpETA || service.state !== 'ASSIGNED') {
      return '---';
    }

    let diff = service.pickUpETA ? service.pickUpETA - Date.now() : 0;
    diff = diff !== null && diff < 0 ? 0 : diff;

    const minutes = Math.floor(diff / 60000);
    const seconds = ((diff % 60000) / 1000).toFixed(0);
    return `${minutes > 9 ? minutes : '0' + minutes}m${seconds.length > 1 ? seconds : '0' + seconds}s`;
  }
  //#endregion

  convertServiceToTableFormat(service) {
    const lastServiceVersion = this.partialData.find(e => e.id === service.id);
    const lastStateChange = service.stateChanges
      ? service.stateChanges.filter(pds => pds.state === service.state).pop()
      : undefined;

    return {
      selected: this.selectedServiceId === service.id ? '>' : '',
      id: service._id,
      state: service.state,
      style: lastServiceVersion
        ? lastServiceVersion.style
        : { state: {}, tTrans: {} },
      creation_timestamp: service.timestamp,
      driverDocumentId: service.driver ? service.driver.documentId : '---',
      // client_name: service.client ? service.client.fullname : '-',
      // pickup_addr: service.pickUp ? service.pickUp.addressLine1 : '-',
      // pickup_neig: service.pickUp ? service.pickUp.neighborhood : '-',
      vehicle_plate: service.vehicle ? service.vehicle.plate : '-',
      eta: this.calculateServiceEta(service),
      state_time_span: this.calcServiceStateTimeSpan(service),
      distance: 0.0,
      lastStateChangeTimeStamp: lastStateChange ? lastStateChange.timestamp : undefined,
      serviceRef: service
    };
  }

  listenSatelliteAndUserProfile() {
    combineLatest(
      this.menuService.currentUserProfile$,
      this.menuService.currentLinkedSatellite$
    )
      .pipe(
        tap(([userProfile, satellite]) => {
          this.userProfile = userProfile;
          this.linkedSatellite = satellite;
        })
      )
      .subscribe();
  }

  updateTable() {

    this.loadPartialData();

    // this.servicesAtQueued = [...this.servicesAtQueued, {
    //   id: Date.now(),
    //   creation_timestamp: Date.now(),
    //   state: 'Solicitado',
    //   vehicle_plate: `TKM${Date.now().toString().slice(-3)}`,
    //   eta: `${Date.now() % 5}: ${Date.now() % 60}`,
    //   style: { state: {} }
    // } ];
    // console.log(this.servicesAtQueued);
  }

  requestService() {
    console.log('mostrar dialogo');
    // if (this.isThereAnOpenDialog()) { return; }
    // if (!this.userRoles.includes('OPERATOR') && !this.userRoles.includes('OPERATION-SUPERVISOR')) {
    //   this.showMessageSnackbar('ERRORS.2');
    //   return;
    // }
    if (!this.userProfile || !this.linkedSatellite ) {
      this.showMessageSnackbar('Intenta de nuevo, por favor');
      return;
    }

    const dialogConfig = new MatDialogConfig();

    // const width = this.layout.total.width > REQUEST_SERVICE_DIALOG_MAX_DIMENSION[0]
    //   ? REQUEST_SERVICE_DIALOG_MAX_DIMENSION[0]
    //   : this.layout.total.width - 10;
    // let height = this.layout.total.height > REQUEST_SERVICE_DIALOG_MAX_DIMENSION[1]
    //   ? REQUEST_SERVICE_DIALOG_MAX_DIMENSION[1]
    //   : this.layout.total.height - 10;

    const width = 340;
    const height = 400;

    dialogConfig.width = `${width}px`;
    dialogConfig.height = `${height + 50}px`;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      client: this.linkedSatellite,
      user: this.userProfile
    };
    dialogConfig.panelClass = 'mat-request-service-dialog';
    // console.log('DIALOG CONFIG ==> ', dialogConfig);

    this.requestServiceDialogRef = this.dialog.open(
      RequestServiceDialogComponent,
      dialogConfig
    );
    this.requestServiceDialogRef.afterClosed().subscribe(data => {
      this.requestServiceDialogRef = undefined;
    });
  }

  cancelService(serviceId) {
    this.satelliteService.cancelService$(serviceId, '');
    this.bottomSheet.open(CancelClientSheetComponent, {data: {
      state: this.partialData.find(s => s.id === serviceId).state,
      id: serviceId
    }});
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

  onRowSelected(serviceRow) {
    console.log(serviceRow);
    this.selectedServiceId = serviceRow.serviceRef._id;
    this.partialData = this.partialData.map(pd => ({
      ...pd,
      selected: this.selectedServiceId === pd.id ? '>' : ''
    }));
  }

  listenServicesUpdates() {
    this.satelliteService.listenServiceUpdates$()
    .pipe(
      // tap(r => console.log(r) ),
      map(update => ((update || {}).data || {}).ClientServiceUpdatedSubscription ),
      tap(service => console.log('listenServicesUpdates ==> ', service)),
      filter(s => s),
      mergeMap(service => this.appendService$(service))
    )
    .subscribe(next => {}, e => console.log(), () => {});
  }


  appendService$(service) {
    console.log('appendService$ ===> ');
    return of(this.partialData.findIndex(raw => raw.id === service._id))
    .pipe(
      map(oldDataIndex => {
        console.log({oldDataIndex});
        if (service.closed) {
          if (oldDataIndex >= 0) {
            this.partialData.splice(oldDataIndex, 1); // DELETE THE SERVICE ITEM FROM LIST
          }
        } else if (oldDataIndex >= 0) {
          const newService = [service].map(s => this.convertServiceToTableFormat(s))[0];
          this.partialData[oldDataIndex] = newService ; // UPDATE SERVICE IN LIST
        } else {
          console.log('SERVICIO NUEVO');
          const newService = [service].map(s => this.convertServiceToTableFormat(s))[0];
          this.partialData.unshift(newService); // INSERT SERVICE IN LIST
        }

        // this.partialData = [...this.partialData];
      }
      ),

    );
    // this.totalData = this.totalRawData.map(s => this.convertServiceToTableFormat(s));
    // await this.recalculatePartialData();
  }

}
