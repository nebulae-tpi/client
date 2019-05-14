import { Component, OnInit } from '@angular/core';
import { MenuService } from '../menu/menu.service';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  userProfile: any;

  constructor(
    private menuService: MenuService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.menuService.currentUserProfile$
      .pipe(
        tap(r => this.userProfile = r),
      )
      .subscribe(ev => {}, e => console.log(e), () => { });
  }

  updateProfile() {
    console.log('UPDATING PROFILE ...');
  }
}
