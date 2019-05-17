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
import { ClienFavoriteService } from '../client-favorites.service';
import { MenuService } from 'src/app/menu/menu.service';

@Component({
  selector: 'app-client-favorite-detail',
  templateUrl: './favorite-detail.component.html',
  styleUrls: ['./favorite-detail.component.css']
})
export class ClientFavoritesDetailComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  satelliteCtrl = new FormControl(null);
  satellitesFiltered$: Observable<any>;

  selectedSatellite: any;
  userProfile: any;
  linkedSatellite: any;
  triedToLinkSatellite = false;

  constructor(
    private route: ActivatedRoute,
    private lienFavoriteService: ClienFavoriteService,
    private menuService: MenuService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
  }

  loadUserProfile() {
    combineLatest(
      this.menuService.currentUserProfile$,
      this.menuService.currentLinkedSatellite$
    )
      .pipe(
        tap(([userProfile, linkedSatellite]) => {
          this.userProfile = userProfile;
          this.linkedSatellite = linkedSatellite;
        })
      )
      .subscribe(ev => {}, e => console.log(e), () => {});
  }
}
