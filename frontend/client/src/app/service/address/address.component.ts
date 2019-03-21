import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  NgZone,
  OnDestroy
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MapsAPILoader } from '@agm/core';
import { ServiceService } from '../service.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ServiceState } from '../service-state';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss']
})
export class AddressComponent implements OnInit, OnDestroy {
  public searchControl: FormControl;
  @ViewChild('search')
  public searchElementRef: ElementRef;
  private ngUnsubscribe = new Subject();
  addressInputValue: String;
  constructor(
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private serviceService: ServiceService
  ) {}

  ngOnInit() {
    this.searchControl = new FormControl();
    this.listenServiceChanges();
    this.buildPlacesAutoComplete();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  buildPlacesAutoComplete() {
    this.mapsAPILoader.load().then(() => {
      const autocomplete = new google.maps.places.Autocomplete(
        this.searchElementRef.nativeElement,
        {
          componentRestrictions: { country: 'co' }
        }
      );
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place: google.maps.places.PlaceResult = autocomplete.getPlace();
          // verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }
          this.addressInputValue = place.formatted_address.split(',')[0];
          this.serviceService.locationChange$.next({
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          });
          this.serviceService.addressChange$.next(this.addressInputValue);
          // set latitude, longitude and zoom
          /*
          this.latitude = place.geometry.location.lat();
          this.longitude = place.geometry.location.lng();
          this.zoom = 12;
          */
        });
      });
    });
  }

  listenServiceChanges() {
    this.serviceService.currentService$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(service => {
        if (service) {
          switch (service.state) {
            case ServiceState.ARRIVED:
            case ServiceState.ASSIGNED:
            case ServiceState.ON_BOARD:
            case ServiceState.REQUESTED:
            this.searchElementRef.nativeElement.disabled = true;
            break;
            default:
            this.searchElementRef.nativeElement.disabled = false;
            break;
          }
        }
      });
  }

  onBlurAddress() {
    // this.serviceService.addressChange$.next(this.addressInputValue);
  }
}
