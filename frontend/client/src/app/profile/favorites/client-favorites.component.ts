import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  map,
  mergeMap,
  takeUntil,
  tap,
  filter,
  debounceTime,
  distinctUntilChanged
} from 'rxjs/operators';
import {
  of,
  Subject,
  Observable,
  combineLatest,
  fromEvent,
  forkJoin
} from 'rxjs';
import { FormControl } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { MenuService } from 'src/app/menu/menu.service';

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
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private menuService: MenuService
  ) {}

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

          this.userProfile.favoritePlaces = [
            {
              id: '1',
              type: 'home',
              name: 'Casa',
              address: 'Cra 50 # 55-22',
              location: { lat: 1, lng: 2.35 }
            },
            {
              id: '2',
              type: 'work',
              name: 'Trabajo',
              address: 'autopista sur # 40 sur',
              location: { lat: 1, lng: 2.35 }
            },
            {
              id: '3',
              type: 'other',
              name: 'Casa de mi tia',
              address: 'la floresta',
              location: { lat: 1, lng: 2.35 }
            },
            {
              id: '4',
              type: 'other',
              name: 'Casa de mi tia',
              address: 'la floresta',
              location: { lat: 1, lng: 2.35 }
            },
            {
              id: '5',
              type: 'other',
              name: 'Casa de mi tia',
              address: 'la floresta',
              location: { lat: 1, lng: 2.35 }
            },
            {
              id: '6',
              type: 'other',
              name: 'Casa de mi tia',
              address: 'la floresta',
              location: { lat: 1, lng: 2.35 }
            },
            {
              id: '7',
              type: 'other',
              name: 'Casa de mi tia',
              address: 'la floresta',
              location: { lat: 1, lng: 2.35 }
            },
            {
              id: '8',
              type: 'other',
              name: 'Casa de mi tia',
              address: 'la floresta',
              location: { lat: 1, lng: 2.35 }
            },
            {
              id: '9',
              type: 'other',
              name: 'Casa de mi tia',
              address: 'la floresta',
              location: { lat: 1, lng: 2.35 }
            }
          ];

          this.userProfile.favoritePlaces.forEach((favorite: any) => {
            // console.log(favorite);
            if (favorite.type === 'home' || favorite.type === 'work') {
              console.log(favorite);
              this.mainFavorites.push(favorite);
            } else {
              this.othersFavorites.push(favorite);
            }
          });
          console.log(this.mainFavorites);
        })
      )
      .subscribe(ev => {}, e => console.log(e), () => {});
  }

  deleteFavoritePlace(favoriteId) {
    const isMainFavorite = this.mainFavorites.findIndex(f => f.id === favoriteId) !== -1;
    let oldOtherFavorite = null;
    if (!isMainFavorite) {
      oldOtherFavorite = this.othersFavorites.find(f => f.id === favoriteId);
      this.othersFavorites = this.othersFavorites.filter(f => f.id !== favoriteId);
    }
    this.profileService.removeMainFavorite$(favoriteId)
      .pipe(
        map((response: any) => ((response || {}).data || {}).RemoveFavoritePlace),
        tap(result => {
          if (isMainFavorite) {
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
        })
      )
      .subscribe(() => {}, e => {}, () => {});
  }

}
