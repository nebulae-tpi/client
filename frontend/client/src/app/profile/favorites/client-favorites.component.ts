import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  map,
  tap,
  filter
} from 'rxjs/operators';
import { Subject, } from 'rxjs';
import { ProfileService } from '../profile.service';
import { MenuService } from 'src/app/menu/menu.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-favorites',
  templateUrl: './client-favorites.component.html',
  styleUrls: ['./client-favorites.component.css']
})
export class ClientFavoritesComponent implements OnInit, OnDestroy {
  mainFavorites = [];
  othersFavorites = [];
  FAVORITE_TYPES = {
    work: 'Trabajo',
    home: 'Casa'
  };
  userProfile: any;

  private ngUnsubscribe = new Subject();

  constructor(
    private profileService: ProfileService,
    private menuService: MenuService,
    private location: Location,
    private router: Router,

  ) { }

  ngOnInit() {
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
  }

  loadUserProfile() {
    this.menuService.currentUserProfile$
      .pipe(
        filter(profile => profile && true),
        tap(r => {
          this.userProfile = r;
          this.userProfile.favoritePlaces.forEach((favorite: any) => {
            if (favorite.type === 'other') {
              this.othersFavorites.push(favorite);
            }
          });
          const homeFavoritePlace = this.userProfile.favoritePlaces.find(fp => fp.type === 'home') || { type: 'home' };
          const workFavoritePlace = this.userProfile.favoritePlaces.find(fp => fp.type === 'work') || { type: 'work' };
          this.mainFavorites = [homeFavoritePlace, workFavoritePlace];
        })
      )
      .subscribe(ev => { }, e => console.log(e), () => { });
  }

  deleteFavoritePlace(favoriteId, type) {

    console.log(favoriteId, type);

    const mainFavorite = this.mainFavorites.find(f => f.id === favoriteId);
    let oldOtherFavorite = null;

    if (!mainFavorite) {
      oldOtherFavorite = this.othersFavorites.find(f => ((f.id === favoriteId) || (f.name === favoriteId)));
      this.othersFavorites = this.othersFavorites.filter(f => f.id !== favoriteId);
    }
    this.profileService.removeFavoritePlace$(favoriteId, oldOtherFavorite.name)
      .pipe(
        map((response: any) => ((response || {}).data || {}).RemoveFavoritePlace),
        tap(result => {
          if (mainFavorite) {
            if (result && result.code === 200) {
              const index = this.mainFavorites.findIndex(f => f.id === favoriteId);
              const oldFavorite = this.mainFavorites[index];
              this.mainFavorites[index] = {
                type: oldFavorite.type,
                name: null,
                address: null,
                location: null
              };
            }
          } else {
            if (!result || result.code !== 200) {
              this.othersFavorites.push(oldOtherFavorite);
            }
          }


          // this.userProfile.favoritePlaces = [...this.mainFavorites, ...this.othersFavorites];
          // this.menuService.currentUserProfile$.next(this.userProfile);

        })
      )
      .subscribe(() => { }, e => { }, () => { });
  }

  useAsOriginPlace(favoriteId) {
    // tslint:disable-next-line: max-line-length
    const favoriteToUse = [...this.mainFavorites, ...this.othersFavorites].find(f => f.id === favoriteId);

    this.router.navigate([ 'service', { origin: favoriteToUse.id } ]);

  }

  backClicked() {
    this.location.back();
  }

}
