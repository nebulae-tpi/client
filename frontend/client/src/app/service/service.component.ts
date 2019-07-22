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
  map
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
import { LocationStrategy } from '@angular/common';

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

  constructor(
    protected serviceService: ServiceService,
    private keycloakService: KeycloakService,
    private gateway: GatewayService,
    private snackBar: MatSnackBar,
    private location: LocationStrategy
  ) {

  }

  ngOnInit() {
    this.listenServiceChanges();
    this.listenResizeEvent();
    this.listenSubscriptionReconnection();

    if (this.gateway.checkIfUserLogger()) {
      of(this.keycloakService.getKeycloakInstance().tokenParsed)
        .pipe(
          mergeMap((tokenParsed: any) => {
            // console.log('tokenParsed => ', tokenParsed.clientId,
            // (tokenParsed.clientId == null && this.keycloakService.getKeycloakInstance().authenticated),
            // (!tokenParsed.clientId && this.keycloakService.getKeycloakInstance().authenticated));
            return (tokenParsed.clientId == null && this.keycloakService.getKeycloakInstance().authenticated)
              ? defer(() => this.keycloakService.updateToken(-1))
              : of(undefined);
          }),
          mergeMap(() => this.serviceService.getBusinessContactInfo$()),
          mergeMap(() => this.serviceService.getCurrentService$())
        )
        .subscribe(service => {
          if (service) {
            // console.log('Llega cambio de servicio:', service);
            this.serviceService.currentService$.next(service);
          }
        });

      this.serviceService.subscribeToClientServiceUpdatedSubscription$()
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(service => {
          if (service) {
            // console.log('Llega cambio de servicio:', service);
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

    this.buildBackgroundListener();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  listenResizeEvent() {
    this.currentService = this.serviceService.currentService$.getValue();
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(50),
        tap(() => this.recalculateLayout())
      ).subscribe();
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
          this.currentService = service;
          console.log('CAMBIO EL ESTADO DEL SERVICIO .....', this.currentService);

          this.recalculateLayout();
        }
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
        if (!service && this.currentService.state !== ServiceState.REQUEST) {
          this.serviceService.currentService$.next({ state: ServiceState.NO_SERVICE });
        } else {
          this.serviceService.publishServiceChanges(service);
        }
      });
  }

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

    console.log('CALCULANDO EL LAYOUT .......');

    switch (this.currentService.state) {
      case ServiceState.NO_SERVICE:
        this.showAddress = true;
        screenHeightWaste = 65;
        break;
      case ServiceState.REQUESTED:
        break;
      case ServiceState.ASSIGNED:
      case ServiceState.ARRIVED:
      case ServiceState.ON_BOARD:
      case ServiceState.REQUEST:
        console.log('this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT',  this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT);
        
        this.showAddress = this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT;
        screenHeightWaste = 135;
        console.log('this.showAddress', this.showAddress);
        

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
        }
        else {
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
          this.showAddress = this.currentService.state === ServiceState.NO_SERVICE ? false : true;

        }
      } else {
        if (this.currentService.state === ServiceState.NO_SERVICE) {
          this.layoutType = ServiceService.LAYOUT_ADDRESS_MAP_CONTENT;
        } else {
          this.layoutType = ServiceService.LAYOUT_DESKTOP_ADDRESS_MAP_CONTENT;
        }
      }
    }


    console.log(' ======> ', {layoutType: this.layoutType, showAddress: this.showAddress});

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
    const { state, tip, pickUp  } = this.currentService;
    switch (state) {
      case ServiceState.NO_SERVICE:
        return 4;
      case ServiceState.REQUEST:
        if(this.layoutType = ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT){
          return 6;
        }
        return 19;
      case ServiceState.REQUESTED:
        if (tip && pickUp.addressLine2) {
          return 15;
        } else if ( pickUp.addressLine2 || tip) {
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

  calculateAddressRows(){
    if(this.layoutType === ServiceService.LAYOUT_MOBILE_VERTICAL_ADDRESS_MAP_CONTENT){

      switch (this.currentService.state) {
        case ServiceState.REQUEST:
          console.log('calculateAddressRows ==>', 8);
          return 8;       
      
        default:
            console.log('calculateAddressRows ==>', ADDRESS_ROWS);
          return ADDRESS_ROWS;
      }

    }
    return ADDRESS_ROWS;
    
  }
  
  calculateMapRows(){

  }
  /* #endregion */
}
