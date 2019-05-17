import { Component, OnInit } from '@angular/core';
import { MenuService } from '../menu/menu.service';
import { tap, filter, map } from 'rxjs/operators';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  userProfile: any;
  mainFavorites: any [] = [];

  FAVORITE_TYPES= {
    work: 'Trabajo',
    home: 'Casa'
  }

  constructor(
    private menuService: MenuService,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.menuService.currentUserProfile$
      .pipe(
        filter(profile => profile && true),
        tap(r => {
          this.userProfile = r;

          this.userProfile.favoritePlaces = [
            {type: 'home', name: 'Casa', address: 'Cra 50 # 55-22', location: {lat: 1, lng: 2.35}},
            {type: 'work', name: 'Trabajo', address: 'autopista sur # 40 sur', location: {lat: 1, lng: 2.35}},
            {type: 'other', name: 'Casa de mi tia', address: 'la floresta', location: {lat: 1, lng: 2.35}},
          ];

          this.userProfile.favoritePlaces.forEach(
            (favorite: any) => {
              // console.log(favorite);
              if (favorite.type === 'home' || favorite.type === 'work') {
                console.log(favorite);
                this.mainFavorites.push(favorite);
              }
            }
          );
          console.log(this.mainFavorites);
        })
      )
      .subscribe(ev => {}, e => console.log(e), () => {});
  }

  updateProfile() {
    console.log('UPDATING PROFILE ...');
  }

  deleteFavoritePlace(favorite) {
    console.log('REMOVING ==> ', favorite);
    this.profileService.removeMainFavorite$(favorite.id)
    .pipe(
      map((response: any) => ((response || {}).data || {}).RemoveFavoritePlace),
      tap(result => {
        if(result && result.code == 200 ){
          const index = this.mainFavorites.findIndex(f => f.type == favorite.type);

          // this.mainFavorites = this.mainFavorites.filter(f => f.type != favorite.type);
          this.mainFavorites[index] = { type: favorite.type, name: null, address: null, location: null  };
        }
      })
    )
    .subscribe(() => {}, e => {}, () => {} )
  }
}
