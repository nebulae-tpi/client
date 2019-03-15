import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { ServiceService } from '../service.service';
import {
  tap,
  filter,
  map,
  takeUntil,
  debounceTime,
  distinctUntilChanged
} from 'rxjs/operators';
import { Subject, of } from 'rxjs';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent implements OnInit, OnDestroy {
  lat = 51.678418;
  lng = 7.809007;
  zoom = 17;
  render = true;
  widthMapContent = 0;
  heightMapContent = 0;
  center$ = new Subject();
  lastCenterResported;
  protected map: any;
  private ngUnsubscribe = new Subject();
  constructor(
    private cdRef: ChangeDetectorRef,
    private serviceService: ServiceService
  ) {}

  /* #region ANGULAR NGS */
  ngOnInit() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
        this.serviceService.locationChange$.next(position.coords);
        // this.showPosition(position);
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
    this.listenLayoutCommands();
    this.listenLocationChanges();
    this.center$
      .pipe(
        debounceTime(1000),
        filter(val => {
          let toReport = false;
          if ((
            this.lastCenterResported &&
            this.lastCenterResported.lat !== (val as any).lat
          )) { toReport = true; }
          this.lastCenterResported = val;
          return toReport;
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(val => {
        this.serviceService.locationChange$.next({
          latitude: (val as any).lat,
          longitude: (val as any).lng
        });
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /* #endregion */

  /* #region TOOLS */
  currentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        if (this.map) {
          this.map.setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        }
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }
  /* #endregion */

  /* #region LISTENERS */

  listenLayoutCommands() {
    this.serviceService.layoutChanges$
      .pipe(
        filter(e => e && e.layout),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(command => {
        this.widthMapContent = command.layout.map.width;
        this.heightMapContent = command.layout.map.height;
      });
  }

  mapReady(map) {
    this.map = map;
  }

  onCenterChange($event) {
    this.center$.next($event);
  }

  listenLocationChanges() {
    this.serviceService.locationChange$
      .pipe(
        filter(evt => evt),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(location => {
        if (this.map) {
          this.map.setCenter({
            lat: location.latitude,
            lng: location.longitude,
            zoom: 17
          });
        }
      });
  }
  /* #endregion */
}
