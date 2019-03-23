/* #region IMPORTS ANGULAR */
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
  AfterViewInit
} from '@angular/core';
/* #endregion */

/* #region IMPORTS RXJS */
import {
  map,
  mergeMap,
  switchMap,
  toArray,
  filter,
  tap,
  takeUntil,
  startWith,
  debounceTime,
  distinctUntilChanged,
  take
} from 'rxjs/operators';

import {
  Subject,
  fromEvent,
  of,
  forkJoin,
  Observable,
  concat,
  combineLatest,
  defer
} from 'rxjs';
/* #endregion */

/* #region IMPORTS CUSTOM SERVICES */

import { ServiceService } from './service.service';
import { ServiceState } from './service-state';
import { KeycloakService } from 'keycloak-angular';
import { GatewayService } from '../api/gateway.service';
import { MatSnackBar } from '@angular/material';

/* #endregion */

const HORIZONTAL_CONTEXT_COLS = 28;
const VERTICAL_CONTEXT_ROWS = 4;
let screenHeightWaste = 110;
const ADDRESS_ROWS = 4;

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.scss']
})
export class ServiceComponent implements OnInit, OnDestroy, AfterViewInit {
  /* #region  VARIABLES*/
  layoutType: number;
  screenCols: number;
  addressCols: number;
  addressRows = 6;
  contextCols: number;
  contextRows: number;
  mapCols: number;
  mapRows: number;
  showAddress = true;
  private ngUnsubscribe = new Subject();

  LAYOUT_MOBILE_HORIZONTAL_ADDRESS_MAP_CONTENT = 0;
  LAYOUT_MOBILE_HORIZONTAL_MAP_CONTENT = 1;
  LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT = 2;
  LAYOUT_MOBILE_VERTICAL_MAP_CONTENT = 3;
  LAYOUT_DESKTOP_ADDRESS_MAP_CONTENT = 4;
  LAYOUT_DESKTOP_MAP_CONTENT = 5;
  LAYOUT_ADDRESS_MAP_CONTENT = 6;
  /* #endregion */

  constructor(
    protected serviceService: ServiceService,
    private keycloakService: KeycloakService,
    private gateway: GatewayService,
    private snackBar: MatSnackBar
  ) {
    this.onResize();
  }

  ngOnInit() {
    console.log('Se llama el onInit.');
    this.listenServiceChanges();
    if (this.gateway.checkIfUserLogger()) {
      this.serviceService
        .validateNewClient$()
        .pipe(
          mergeMap(response => {
            const clientId = response && response.data
            && response.data.ValidateNewClient ? response.data.ValidateNewClient.clientId: undefined;

            if (clientId && this.keycloakService.getKeycloakInstance().authenticated) {
              return defer(() => this.keycloakService.updateToken(-1));
            }
            return of(undefined);
          }),
          mergeMap(() => this.serviceService.getCurrentService$())
        )
        .subscribe(service => {
          if (service) {
            console.log('Llega cambio de servicio:', service);
            this.serviceService.currentService$.next(service);
          }
        });
      this.serviceService
        .subscribeToClientServiceUpdatedSubscription$()
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(service => {
          if (service) {
            console.log('Llega cambio de servicio:', service);
            if (service.state === ServiceState.CANCELLED_DRIVER) {
              this.showSnackBar('El conductor ha cancelado el servicio');
              this.serviceService.currentService$.next({
                state: ServiceState.NO_SERVICE
              });
            } else if (
              service.state === ServiceState.CANCELLED_OPERATOR ||
              service.state === ServiceState.CANCELLED_SYSTEM
            ) {
              this.showSnackBar('El sistema ha cancelado el servicio');
              this.serviceService.currentService$.next({
                state: ServiceState.NO_SERVICE
              });
            } else if (service.state === ServiceState.DONE) {
              this.serviceService.currentService$.next({
                state: ServiceState.NO_SERVICE
              });
            } else {
              this.serviceService.currentService$.next(service);
            }
          }
        });
    }
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngAfterViewInit() {
    console.log('afterViewInit');
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.recalculateLayout();
  }

  showSnackBar(message) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 2000
    });
  }

  /* #region LAYOUT CONTROL */

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(service => {
        if (service) {
          this.recalculateLayout();
          // this.currentService = service;
        }
      });
  }

  /**
   * Recalculate layout type and dimensions
   */
  recalculateLayout() {
    // this.showAddress = true;

    if (this.serviceService.currentService$.getValue()) {
      switch (this.serviceService.currentService$.getValue().state) {
        case ServiceState.NO_SERVICE:
        case ServiceState.REQUEST:
          this.showAddress = true;
          screenHeightWaste = 110;
          break;
        case ServiceState.REQUESTED:
        case ServiceState.ASSIGNED:
        case ServiceState.ARRIVED:
        case ServiceState.ON_BOARD:
          this.showAddress = false;
          screenHeightWaste = 70;
          break;
        default:
          this.showAddress = true;
          screenHeightWaste = 110;
          break;
      }
    }

    const rowHeight = 10;
    const colWidth = 10;
    const screenHeight = window.innerHeight - screenHeightWaste;
    const screenWidth = window.innerWidth;
    const onMobile = screenWidth < 820;
    const horizontalLayout = onMobile
      ? screenWidth >= (screenHeight + screenHeightWaste) * 1.5
      : screenWidth >= screenHeight;

    const screenRows = screenHeight / rowHeight;
    this.screenCols = screenWidth / colWidth;
    if (!this.showAddress) {
      if (onMobile) {
        if (horizontalLayout) {
          this.layoutType = ServiceService.LAYOUT_MOBILE_HORIZONTAL_MAP_CONTENT;
        } else {
          this.layoutType = ServiceService.LAYOUT_MOBILE_VERTICAL_MAP_CONTENT;
        }
      } else {
        this.layoutType = ServiceService.LAYOUT_DESKTOP_MAP_CONTENT;
      }
    } else {
      if (onMobile) {
        if (horizontalLayout) {
          if (
            this.serviceService.currentService$.getValue().state ===
            ServiceState.NO_SERVICE
          ) {
            this.layoutType = ServiceService.LAYOUT_ADDRESS_MAP_CONTENT;
          } else {
            this.layoutType =
              ServiceService.LAYOUT_MOBILE_HORIZONTAL_ADDRESS_MAP_CONTENT;
          }
        } else {
          this.layoutType =
            ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT;
        }
      } else {
        if (
          this.serviceService.currentService$.getValue().state ===
          ServiceState.NO_SERVICE
        ) {
          this.layoutType = ServiceService.LAYOUT_ADDRESS_MAP_CONTENT;
        } else {
          this.layoutType = ServiceService.LAYOUT_DESKTOP_ADDRESS_MAP_CONTENT;
        }
      }
    }
    // console.log('layoutType: ', this.layoutType);
    if (this.showAddress) {
      if (horizontalLayout) {
        this.addressCols = this.screenCols;
        this.addressRows = ADDRESS_ROWS;
        this.contextCols = HORIZONTAL_CONTEXT_COLS;
        this.contextRows = screenRows;
        this.mapCols =
          this.layoutType !== ServiceService.LAYOUT_ADDRESS_MAP_CONTENT
            ? this.screenCols - HORIZONTAL_CONTEXT_COLS
            : this.screenCols;
        this.mapRows = screenRows;
      } else {
        this.addressCols = this.screenCols;
        this.addressRows = ADDRESS_ROWS;
        this.contextCols = this.screenCols;
        this.calculateContextRows();
        this.mapCols = this.screenCols;
        this.mapRows = screenRows - this.contextRows;
      }
    } else {
      if (horizontalLayout) {
        this.addressCols = 0;
        this.addressRows = 0;
        this.contextCols = HORIZONTAL_CONTEXT_COLS;
        this.contextRows = screenRows;
        this.mapCols =
          this.layoutType !== ServiceService.LAYOUT_ADDRESS_MAP_CONTENT
            ? this.screenCols - HORIZONTAL_CONTEXT_COLS
            : this.screenCols;
        this.mapRows = screenRows;
      } else {
        this.addressCols = 0;
        this.addressRows = 0;
        this.contextCols = this.screenCols;
        this.calculateContextRows();
        this.mapCols = this.screenCols;
        this.mapRows = screenRows - this.contextRows;
      }
    }

    this.serviceService.publishLayoutChange(
      this.layoutType,
      this.addressCols * colWidth,
      this.addressRows * rowHeight,
      this.mapCols * colWidth,
      this.mapRows * rowHeight,
      this.contextCols * colWidth,
      this.contextRows * rowHeight
    );
  }

  calculateContextRows() {
    switch (this.serviceService.currentService$.getValue().state) {
      case ServiceState.NO_SERVICE:
        this.contextRows = 4;
        break;
      case ServiceState.REQUEST:
        this.contextRows = 30;
        break;
      case ServiceState.REQUESTED:
        this.contextRows = 22;
        break;
      case ServiceState.ASSIGNED:
      case ServiceState.ARRIVED:
        if (
          this.serviceService.currentService$.getValue().pickUp.addressLine1 !==
          this.serviceService.currentService$.getValue().pickUp.addressLine2
        ) {
          if (this.serviceService.currentService$.getValue().tip) {
            this.contextRows = 37;
          } else {
            this.contextRows = 32;
          }
        } else if (this.serviceService.currentService$.getValue().tip) {
          this.contextRows = 30;
        } else {
          this.contextRows = 25;
        }
        break;
      case ServiceState.ON_BOARD:
        if (this.serviceService.currentService$.getValue().tip) {
          this.contextRows = 25;
        } else {
          this.contextRows = 19;
        }
        break;
      default:
        this.contextRows = 4;
        break;
    }
  }
  /* #endregion */
}
