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
  addressInputValue = '';
  autocomplete: any;
  showAddress = true;
  showOfferHeader = false;
  showAssignedHeader = false;
  showWithoutService = false;
  showArrivedHeader = false;
  showOnBoardHeader = false;
  constructor(
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private serviceService: ServiceService
  ) {}

  ngOnInit() {
    this.searchControl = new FormControl();
    this.listenServiceChanges();
    this.listenLocationChanges();
    if (this.showAddress === true) {
        this.buildPlacesAutoComplete();
    }
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
          if (!place || place.geometry === undefined || place.geometry === null) {
            return;
          }
          const { address_components, name, formatted_address } = place;

          console.log('PLACE ==> ', {name, formatted_address, address_components});
          const stringsToRemove = [', Antioquia', ', Valle del Cauca', ', Colombia'];
          this.addressInputValue = `${place.name}, ${place.formatted_address.split(',').slice(1)}`;
          stringsToRemove.forEach(s => this.addressInputValue = this.addressInputValue.replace(s, ''));
          // place.formatted_address.split(',')[0];

          this.serviceService.locationChange$.next({
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          });
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
        const latlng = new google.maps.LatLng(
          location.latitude,
          location.longitude
        );
        const circle = new google.maps.Circle({
          center: latlng,
          radius: 20000 // meters
        });
        if (!this.autocomplete && this.showAddress) {
          this.buildPlacesAutoComplete();
          setTimeout(() => {
            try {
              this.autocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
            } catch (error) {
            }
          }, 1000);
        } else if (this.showAddress) {
          this.autocomplete.setOptions({ bounds: circle.getBounds(), strictBounds: true });
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
        console.log('Se escucha service: ', service);
        if (service) {
          switch (service.state) {
            case ServiceState.NO_SERVICE:
            case ServiceState.CANCELLED_CLIENT:
            case ServiceState.CANCELLED_DRIVER:
            case ServiceState.CANCELLED_OPERATOR:
            case ServiceState.CANCELLED_SYSTEM:
            case ServiceState.DONE:
              this.showAddress = true;
              this.showOfferHeader = false;
              this.showAssignedHeader = false;
              this.showWithoutService = false;
              this.showArrivedHeader = false;
              this.showOnBoardHeader = true;
              break;
            case ServiceState.REQUESTED:
              this.showOfferHeader = true;
              this.showAddress = false;
              this.showAssignedHeader = false;
              this.showWithoutService = false;
              this.showArrivedHeader = false;
              this.showOnBoardHeader = true;
              break;
            case ServiceState.ASSIGNED:
              this.showAssignedHeader = true;
              this.showOfferHeader = false;
              this.showAddress = false;
              this.showWithoutService = false;
              this.showArrivedHeader = false;
              this.showOnBoardHeader = true;
              break;
            case ServiceState.ARRIVED:
              this.showAssignedHeader = false;
              this.showOfferHeader = false;
              this.showAddress = false;
              this.showWithoutService = false;
              this.showArrivedHeader = true;
              this.showOnBoardHeader = true;
              break;
            case ServiceState.ON_BOARD:
              this.showAssignedHeader = false;
              this.showOfferHeader = false;
              this.showAddress = false;
              this.showWithoutService = false;
              this.showArrivedHeader = false;
              this.showOnBoardHeader = true;
              break;
            default:
              this.showWithoutService = true;
              this.showOfferHeader = false;
              this.showAddress = false;
              this.showAssignedHeader = false;
              this.showArrivedHeader = false;
              this.showOnBoardHeader = true;
              break;
          }
        }
      });
  }

  onBlurAddress() {
    // this.serviceService.addressChange$.next(this.addressInputValue);
  }
}
