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
  constructor(private mapsAPILoader: MapsAPILoader, private ngZone: NgZone, private serviceService: ServiceService) {}

  ngOnInit() {
    this.searchControl = new FormControl();
    this.listenLocationChanges();
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
          types: ['address'],
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
          console.log(place);
          this.serviceService.locationChange$.next({latitude: place.geometry.location.lat(), longitude: place.geometry.location.lng()});
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
}
