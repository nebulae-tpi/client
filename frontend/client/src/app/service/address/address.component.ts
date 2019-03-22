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
  autocomplete: any;
  constructor(
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private serviceService: ServiceService
  ) {}

  ngOnInit() {
    this.searchControl = new FormControl();
    this.listenServiceChanges();
    this.listenLocationChanges();
    this.buildPlacesAutoComplete();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  buildPlacesAutoComplete() {
    this.mapsAPILoader.load().then(() => {
      this.autocomplete = new google.maps.places.Autocomplete(
        this.searchElementRef.nativeElement,
        {
          componentRestrictions: { country: 'co' }
        }
      );
      this.autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place: google.maps.places.PlaceResult = this.autocomplete.getPlace();
          // verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }
          this.addressInputValue = place.formatted_address.split(',')[0];
          this.serviceService.locationChange$.next({
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          });
          console.log('se setea a true');
          this.serviceService.fromAddressLocation = true;
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

  listenLocationChanges() {
    this.serviceService.locationChange$
      .pipe(
        filter(evt => evt),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(location => {
        const latlng = new google.maps.LatLng(location.latitude, location.longitude);
        const circle = new google.maps.Circle({
          center: latlng,
          radius: 50000 // meter
        });
        if (this.autocomplete) {
          this.autocomplete.setOptions({bounds: circle.getBounds()});
        }
        /*
        this.mapsAPILoader.load().then(() => {
          const geocoder = new google.maps.Geocoder;
          const latlng = {lat: location.latitude, lng: location.longitude};
          geocoder.geocode({location: latlng}, function(results) {
              if (results[0]) {
                // that.currentLocation = results[0].formatted_address;
                console.log(results[0]);
              } else {
                console.log('No results found');
              }
          });
        });
        */
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
