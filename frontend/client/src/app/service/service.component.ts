/* #region IMPORTS ANGULAR */
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener
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
  combineLatest
} from 'rxjs';
/* #endregion */

/* #region IMPORTS CUSTOM SERVICES */

import { ServiceService } from './service.service';
import { ServiceState } from './service-state';

/* #endregion */

const HORIZONTAL_CONTEXT_COLS = 15;
const VERTICAL_CONTEXT_ROWS = 10;
const SCREEN_HEIGHT_WASTE = 110;
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
  /* #endregion */

  constructor(protected serviceService: ServiceService) {
    this.onResize();
  }

  ngOnInit() {
    this.listenLayoutCommnads();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.recalculateLayout();
  }

  /* #region LAYOUT CONTROL */
  listenLayoutCommnads() {
    this.serviceService.layoutChanges$
      .pipe(
        filter(e => e && e.command),
        map(({ command }) => command),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(
        command => {
          console.log(command);
          switch (command.serviceState) {
            case ServiceState.NO_SERVICE:
            case ServiceState.REQUEST:
              this.showAddress = true;
              this.recalculateLayout();
              break;
            case ServiceState.REQUESTED:
            case ServiceState.ASSIGNED:
            case ServiceState.ARRIVED:
            case ServiceState.ON_BOARD:
              this.showAddress = false;
              this.recalculateLayout();
              break;
            default:
              this.showAddress = true;
              this.recalculateLayout();
              break;
          }
        },
        error =>
          console.error(
            `operator-workstation.listenLayoutChanges.ngOnInit: Error => ${error}`
          ),
        () =>
          console.log(
            `operator-workstation.listenLayoutChanges.ngOnInit: Completed`
          )
      );
  }

  /**
   * Recalculate layout type and dimensions
   */
  recalculateLayout() {
    const rowHeight = 10;
    const colWidth = 10;
    let screenHeight = window.innerHeight - SCREEN_HEIGHT_WASTE;
    const screenWidth = window.innerWidth;
    const horizontalLayout = screenWidth >= screenHeight * 1.5;

    if (!horizontalLayout) {
      screenHeight = screenHeight - 65;
    }

    const screenRows = screenHeight / rowHeight;
    this.screenCols = screenWidth / colWidth;
    if (!this.showAddress) {
      if (screenHeight < 900) {
        if (horizontalLayout) {
          this.layoutType = ServiceService.LAYOUT_MOBILE_HORIZONTAL_MAP_CONTENT;
        } else {
          this.layoutType = ServiceService.LAYOUT_MOBILE_VERTICAL_MAP_CONTENT;
        }
      } else {
        this.layoutType = ServiceService.LAYOUT_DESKTOP_MAP_CONTENT;
      }
    } else {
      if (screenWidth < 1000) {
        if (horizontalLayout) {
          if (this.serviceService.serviceState === ServiceState.NO_SERVICE) {
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
        if (this.serviceService.serviceState === ServiceState.NO_SERVICE) {
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
        this.addressRows = ADDRESS_ROWS;
        this.contextCols = this.screenCols;
        this.contextRows = VERTICAL_CONTEXT_ROWS;
        this.mapCols = this.screenCols;
        this.mapRows = screenRows - this.addressRows;
      }
    } else {
      this.contextCols = this.screenCols;
      this.contextRows = VERTICAL_CONTEXT_ROWS;
      this.mapCols = this.screenCols;
      this.mapRows = screenRows - this.contextRows;
    }

    this.serviceService.publishLayoutChange(
      this.layoutType,
      !this.showAddress ? undefined : this.addressCols * colWidth,
      !this.showAddress ? undefined : this.addressRows * rowHeight,
      this.mapCols * colWidth,
      this.mapRows * rowHeight,
      this.contextCols * colWidth,
      this.contextRows * rowHeight
    );
  }
  /* #endregion */
}
