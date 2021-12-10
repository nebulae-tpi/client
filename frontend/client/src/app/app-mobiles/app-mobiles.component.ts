import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  map,
  tap,
  filter,
  mergeMap,
  takeUntil
} from 'rxjs/operators';
import { Subject, forkJoin, of, } from 'rxjs';
import { MenuService } from 'src/app/menu/menu.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { ServiceService } from '../service/service.service';

@Component({
  selector: 'app-mobiles',
  templateUrl: './app-mobiles.component.html',
  styleUrls: ['./app-mobiles.component.css']
})
export class AppMobilesComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  public textMessage: String;
  private urlParams: String;
  public messageList = [];
  hrefMobileToken = '';
  constructor(
    private menuService: MenuService,
    private serviceService: ServiceService,
    private location: Location,
    private router: Router,
    private snackBar: MatSnackBar,

  ) { }

  ngOnInit() {
    this.hrefMobileToken = window.location.href.replace("/appmobiles/", "/app-mobile/");
    console.log("INGRES ON IF ===> ");
    setTimeout(() => {
      console.log("INGRES EJEXUTA TIMEOUT");
      const element: HTMLElement = document.getElementById("redirectC") as HTMLElement;
      element.click();
    }, 5000);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
  }


  redirectAppMobile() {
    console.log("SE EJECUTA BOTON!!!!!!1")
    this.hrefMobileToken = window.location.href.replace("/appmobiles/", "/app-mobile/");
    const element: HTMLElement = document.getElementById("redirectC") as HTMLElement;
    element.click();
  }

  backClicked() {
    this.location.back();
  }


  showSnackMessage(message, timeout = 3000) {
    this.snackBar.open(message, 'Cerrar', {
      duration: timeout
    });
  }
}
