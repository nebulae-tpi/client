import { Component, OnInit } from '@angular/core';
import { MenuService } from '../menu/menu.service';
import { combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-satellite',
  templateUrl: './satellite.component.html',
  styleUrls: ['./satellite.component.css']
})
export class SatelliteComponent implements OnInit {
  userProfile: any;
  satellite: any;
  servicesAtQueued: any[];

  constructor(
    private menuService: MenuService
  ) {}

  ngOnInit() {
    this.loadSatelliteAndUserProfile();
  }


  loadSatelliteAndUserProfile(){
   combineLatest(     
     this.menuService.currentUserProfile$,
     this.menuService.currentLinkedSatellite$,
   )
   .pipe(
     tap(([userProfile, satellite]) => {
       this.userProfile = userProfile;
       this.satellite = satellite
     })
   )
   .subscribe();
  }
}
