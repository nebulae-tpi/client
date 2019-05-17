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

  FAVORITE_TYPES = {
    work: 'Trabajo',
    home: 'Casa'
  };

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
          const homeFavoritePlace = this.userProfile.favoritePlaces.find(fp => fp.type === 'home') || { type: 'home' };
          const workFavoritePlace = this.userProfile.favoritePlaces.find(fp => fp.type === 'work') || { type: 'work' };
          this.mainFavorites = [homeFavoritePlace, workFavoritePlace];
        })
      )
      .subscribe(ev => {}, e => console.log(e), () => {});
  }

  updateProfile() {
    console.log('UPDATING PROFILE ...');
  }

  deleteFavoritePlace(favorite) {
    console.log('REMOVING ==> ', favorite);
    this.profileService.removeFavoritePlace$(favorite.id, favorite.name)
    .pipe(
      map((response: any) => ((response || {}).data || {}).RemoveFavoritePlace),
      tap((result: any) => {
        if (result && result.code === 200) {
          const index = this.mainFavorites.findIndex(f => f.type === favorite.type);
          // this.mainFavorites = this.mainFavorites.filter(f => f.type != favorite.type);
          this.mainFavorites[index] = { type: favorite.type, name: null, address: null, location: null  };
        }
      })
    )
    .subscribe(() => {}, e => {}, () => {} );
  }
}
