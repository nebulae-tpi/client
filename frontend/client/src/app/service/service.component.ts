/* #region IMPORTS ANGULAR */
import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
/* #endregion */

/* #region IMPORTS RXJS */
import {
  mergeMap,
  filter,
  takeUntil,
  debounceTime,
  tap,
  distinctUntilChanged
} from 'rxjs/operators';

import {
  Subject,
  of,
  defer,
  interval,
  fromEvent
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
export class ServiceComponent implements OnInit, OnDestroy {
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

  requestStep = 0;

  private ngUnsubscribe = new Subject();

  LAYOUT_MOBILE_HORIZONTAL_ADDRESS_MAP_CONTENT = 0;
  LAYOUT_MOBILE_HORIZONTAL_MAP_CONTENT = 1;
  LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT = 2;
  LAYOUT_MOBILE_VERTICAL_MAP_CONTENT = 3;
  LAYOUT_DESKTOP_ADDRESS_MAP_CONTENT = 4;
  LAYOUT_DESKTOP_MAP_CONTENT = 5;
  LAYOUT_ADDRESS_MAP_CONTENT = 6;
  isWindowVisible = true;
  /* #endregion */

  currentService: any = {};
  showFiltersInRequestConfirmation = false;

  constructor(
    protected serviceService: ServiceService,
    private keycloakService: KeycloakService,
    private gateway: GatewayService,
    private snackBar: MatSnackBar
  ) {

  }

  ngOnInit() {
    this.listenServiceChanges();
    this.listenResizeEvent();
    this.listenSubscriptionReconnection();

    this.checkIfUserIsLoggedAndListenServiceUpdates();
    this.buildBackgroundListener();

    this.listenServiceCommands();
  }


  checkIfUserIsLoggedAndListenServiceUpdates() {
    if (this.gateway.checkIfUserLogger()) {

      of(this.keycloakService.getKeycloakInstance().tokenParsed)
        .pipe(
          mergeMap((tokenParsed: any) => (tokenParsed.clientId == null && this.keycloakService.getKeycloakInstance().authenticated)
            // console.log('tokenParsed => ', tokenParsed.clientId,
            // (tokenParsed.clientId == null && this.keycloakService.getKeycloakInstance().authenticated),
            // (!tokenParsed.clientId && this.keycloakService.getKeycloakInstance().authenticated));

            ? defer(() => this.keycloakService.updateToken(-1))
            : of(undefined)
          ),
          mergeMap(() => this.serviceService.getBusinessContactInfo$()),
          mergeMap(() => this.serviceService.getCurrentService$()),
          filter(service => service),
          takeUntil(this.ngUnsubscribe)
        )
        .subscribe(service => this.serviceService.publishServiceChanges(service));


      this.serviceService.subscribeToClientServiceUpdatedSubscription$()
        .pipe(
          filter(service => service),
          distinctUntilChanged((a, b) => {

            const diffId = a._id === b._id;
            const diffState = a.state === b.state;
            /*
              timestamp
              vehicle
              driver
              pickUp
              pickUpETA
              dropOff
              location
              dropOffSpecialType
              verificationCode
              requestedFeatures
              paymentType
              fareDiscount
              fare
              tip
              route
              lastModificationTimestamp
             */
            return diffId && diffState

          }),
          takeUntil(this.ngUnsubscribe)
        )
        .subscribe((service: any) => {
          console.log('SERVICE UPDATES ==> ', service);

          switch (service.state) {
            case ServiceState.CANCELLED_DRIVER:
              this.showSnackBar('El conductor ha cancelado el servicio');
              this.serviceService.publishServiceChanges({ state: ServiceState.NO_SERVICE });
              break;

            case ServiceState.CANCELLED_OPERATOR:
              this.showSnackBar('El sistema ha cancelado el servicio');
              this.serviceService.publishServiceChanges({ state: ServiceState.NO_SERVICE });
              break;
            case ServiceState.CANCELLED_SYSTEM:
              this.showSnackBar('El sistema ha cancelado el servicio');
              this.serviceService.publishServiceChanges({ state: ServiceState.NO_SERVICE });
              break;
            case ServiceState.DONE:
              this.serviceService.publishServiceChanges({ state: ServiceState.NO_SERVICE });
              break;
            default:
              this.serviceService.publishServiceChanges(service);
          }
        });
    }
  }

  listenServiceCommands() {
    this.serviceService.serviceCommands$
      .pipe(
        filter(command => command && command.code)
      ).subscribe(command => {
        switch (command.code) {
          case ServiceService.COMMAND_REQUEST_STATE_SHOW_FILTERS:

            this.requestStep = 2;
            this.recalculateLayout();


            break;

          default:
            break;
        }
      });
  }


  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * listen the window size changes
   */
  listenResizeEvent() {
    this.currentService = this.serviceService.currentService$.getValue();
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(50)
      ).subscribe(() => {
        this.recalculateLayout();
      });
  }

  /**
   * Shows a message using snackbar component
   * @param message message to show
   */
  showSnackBar(message) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 2000
    });
  }

  /* #region LAYOUT CONTROL */

  /**
   * listen service changes
   */
  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(
        // distinctUntilChanged(),
        filter((service: any) => service),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(service => {
        console.log('SERVICE COMPONENT  ON listenServiceChanges ==> ', service);

        this.currentService = service;
        this.recalculateLayout();
      });
  }

  /**
   * If a reconnected event is received from the graphql subscriptions then
   * we have to request the current service to update the  info
   */
  listenSubscriptionReconnection() {
    this.gateway.onSubscriptionClientEvent$
      .pipe(
        filter(subscriptionConnectionEvent => subscriptionConnectionEvent === 'reconnected'),
        mergeMap(() => this.serviceService.currentService$),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((service: any) => {
        console.log('SERVICE COMPONENT ON listenSubscriptionReconnection ===> ', service);

        if (!service && this.currentService.state !== ServiceState.REQUEST) {
          this.serviceService.publishServiceChanges({ state: ServiceState.NO_SERVICE });
        } else {
          this.serviceService.publishServiceChanges(service);
        }
      });
  }

  /**
   * todo
   */
  buildBackgroundListener() {
    interval(1000)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        if (!document.hidden && !this.isWindowVisible) {
          this.serviceService.onResume$.next({});
        }
        this.isWindowVisible = !document.hidden;
      });
  }

  /**
   * Recalculate layout type and dimensions
   */
  recalculateLayout() {
    switch (this.currentService.state) {
      case ServiceState.NO_SERVICE:
        this.showAddress = true;
        screenHeightWaste = 65;
        break;
      case ServiceState.REQUESTED:
        screenHeightWaste = 65;
        break;
      case ServiceState.ASSIGNED:
      case ServiceState.ARRIVED:
      case ServiceState.ON_BOARD:
      case ServiceState.REQUEST:
        this.showAddress = this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT;
        screenHeightWaste = 130;

        break;
      default:
        this.showAddress = true;
        screenHeightWaste = 110;
        break;
    }

    const rowHeight = 10;
    const colWidth = 10;

    let screenHeight = window.innerHeight - screenHeightWaste;
    const screenWidth = window.innerWidth;

    const onMobile = screenWidth < 820;

    const horizontalLayout = onMobile
      ? screenWidth >= (screenHeight + screenHeightWaste) * 1.5
      : screenWidth >= screenHeight;

    if (horizontalLayout) {
      // this.showAddress = true;
      screenHeightWaste = 110;
      screenHeight = window.innerHeight - screenHeightWaste;
    }

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
          if (this.currentService.state === ServiceState.NO_SERVICE) {
            this.layoutType = ServiceService.LAYOUT_ADDRESS_MAP_CONTENT;
          } else {
            this.layoutType = ServiceService.LAYOUT_MOBILE_HORIZONTAL_ADDRESS_MAP_CONTENT;
          }
        } else {
          this.layoutType = ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT;
          // don't show addres input in vertical phone layout in NO_SERVICE state
          this.showAddress = this.currentService.state !== ServiceState.NO_SERVICE;
          this.showAddress = this.showAddress && !(this.currentService.state === ServiceState.REQUEST && this.requestStep === 2);
        }
      } else {
        if (this.currentService.state === ServiceState.NO_SERVICE) {
          this.layoutType = ServiceService.LAYOUT_ADDRESS_MAP_CONTENT;
        } else {
          this.layoutType = ServiceService.LAYOUT_DESKTOP_ADDRESS_MAP_CONTENT;
        }
      }
    }



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
        this.addressRows = this.calculateAddressRows();
        this.contextCols = this.screenCols;
        this.contextRows = this.calculateContextRows();
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
        this.contextRows = this.calculateContextRows();
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
    const { state, tip, pickUp } = this.currentService;
    switch (state) {
      case ServiceState.NO_SERVICE:
        return 4;
      case ServiceState.REQUEST:
        if (this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT) {
          if (this.currentService.state === ServiceState.REQUEST && this.requestStep === 2) {
            return 24;
          }
          return 6;
        }
        return 19;
      case ServiceState.REQUESTED:
        if (tip && pickUp.addressLine2) {
          return 15;
        } else if (pickUp.addressLine2 || tip) {
          return 12;
        } else {
          return 10;
        }
      case ServiceState.ASSIGNED:
        return 20;
      case ServiceState.ARRIVED:
        return 20;
      case ServiceState.ON_BOARD:
        return 17;
      default:
        return 4;
    }
  }

  calculateAddressRows() {
    if (this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT) {

      switch (this.currentService.state) {
        case ServiceState.REQUEST:
          // console.log('calculateAddressRows ==>', 8);
          return 8;

        default:
          // console.log('calculateAddressRows ==>', ADDRESS_ROWS);
          return ADDRESS_ROWS;
      }

    }
    return ADDRESS_ROWS;

  }

  /* #endregion */
}
