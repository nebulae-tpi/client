import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MenuService } from '../menu/menu.service';
import { combineLatest, of } from 'rxjs';
import { tap, map, mergeMap } from 'rxjs/operators';
import { MatDialogConfig, MatDialogRef, MatDialog } from '@angular/material';
import { RequestServiceDialogComponent } from './request-service-dialog/request-service-dialog.component';
import { SatelliteService } from './satellite.service';

@Component({
  selector: 'app-satellite',
  templateUrl: './satellite.component.html',
  styleUrls: ['./satellite.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SatelliteComponent implements OnInit {
  userProfile: any;
  linkedSatellite: any;

  selectedServiceId: string;

  // DATA TABLE
  servicesAtQueued: any[];
  displayedColumns = ['state', 'creation_timestamp', 'vehicle_plate', 'eta', 'actions'];
  SERVICES_STATES = {
    REQUESTED: 'Solicitado'
  };

  private requestServiceDialogRef: MatDialogRef<RequestServiceDialogComponent> = undefined;

  constructor(
    private menuService: MenuService,
    private satelliteService: SatelliteService,
    private dialog: MatDialog,
    ) { }

  ngOnInit() {
    this.listenSatelliteAndUserProfile();
    this.loadServicesAtQueued();

    this.servicesAtQueued = [];
  }

  loadServicesAtQueued() {
    of(new Date())
    .pipe(
      mergeMap(() => this.satelliteService.queryServices$()),
      map((response: any) => ((response || {}).data || {}).CurrentServices || []),
      tap(serviceList => {
        console.log('CURRENT SERVICES ==> ', serviceList);
        this.servicesAtQueued = serviceList.map(s => this.convertServiceToTableFormat(s));
      })
    )
    .subscribe();
  }


  convertServiceToTableFormat(service) {
    const lastServiceVersion = this.servicesAtQueued.find(e => e.id === service.id);
    const lastStateChange = service.stateChanges ? service.stateChanges.filter(pds => pds.state === service.state).pop() : undefined;

    return {
      selected: this.selectedServiceId === service.id ? '>' : '',
      id: service.id,
      state: service.state,
      style: lastServiceVersion ? lastServiceVersion.style : { state: {}, tTrans: {} },
      creation_timestamp: service.timestamp,
      driverDocumentId: service.driver ? service.driver.documentId : '---',
      client_name: service.client ? service.client.fullname : '-',
      pickup_addr: service.pickUp ? service.pickUp.addressLine1 : '-',
      pickup_neig: service.pickUp ? service.pickUp.neighborhood : '-',
      vehicle_plate: service.vehicle ? service.vehicle.plate : '-',
      eta: this.calcServiceEta(service),
      state_time_span: this.calcServiceStateTimeSpan(service),
      distance: 0.00,
      lastStateChangeTimeStamp: lastStateChange ? lastStateChange.timestamp : undefined,
      serviceRef: service
    };
  }

  calcServiceEta(service) {
    if (!service.pickUpETA || service.state !== 'ASSIGNED') {
      return '---';
    }

    let diff = service.pickUpETA ? service.pickUpETA - Date.now() : 0;
    diff = (diff !== null && diff < 0) ? 0 : diff;

    const minutes = Math.floor(diff / 60000);
    const seconds = ((diff % 60000) / 1000).toFixed(0);
    return `${minutes > 9 ? minutes : '0' + minutes}m${seconds.length > 1 ? seconds : '0' + seconds}s`;
  }

  calcServiceStateTimeSpan(service) {
    const latestState = service.stateChanges ? service.stateChanges.filter(pds => pds.state === service.state).pop() : undefined;
    if (latestState) {
      const diff = Date.now() - latestState.timestamp;
      const minutes = Math.floor(diff / 60000);
      const seconds = ((diff % 60000) / 1000).toFixed(0);
      return `${minutes > 9 ? minutes : '0' + minutes}m${seconds.length > 1 ? seconds : '0' + seconds}s`;
    } else {
      return '---';
    }
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
    dialogConfig.data = { client: this.linkedSatellite, user: this.userProfile };
    dialogConfig.panelClass = 'mat-request-service-dialog';
    console.log('DIALOG CONFIG ==> ', dialogConfig);

    this.requestServiceDialogRef = this.dialog.open(RequestServiceDialogComponent, dialogConfig);
    this.requestServiceDialogRef.afterClosed().subscribe(
      data => {
        this.requestServiceDialogRef = undefined;
      }
    );
  }

  cancelService(ev) {
    console.log('cancelService ==>', ev);
  }

  onRowSelected(serviceRow) {
    console.log(serviceRow);
    // this.selectedServiceId = serviceRow.serviceRef.id;
    // this.servicesAtQueued = this.servicesAtQueued.map(pd => ({
    //   ...pd,
    //   selected: this.selectedServiceId === pd.id ? '>' : ''
    // }));
  }
}
