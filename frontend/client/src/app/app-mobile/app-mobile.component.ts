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
  selector: 'app-mobile',
  templateUrl: './app-mobile.component.html',
  styleUrls: ['./app-mobile.component.css']
})
export class AppMobileComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  public textMessage: String;
  private urlParams: String;
  public messageList = [];
  constructor(
    private menuService: MenuService,
    private serviceService: ServiceService,
    private location: Location,
    private router: Router,
    private snackBar: MatSnackBar,

  ) { }

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
  }


  redirectAppMobile() {
    // const element: HTMLElement = document.getElementById("redirectA") as HTMLElement;
    // element.click();  
    if(this.router.url.includes("/?state")){
      window.location.href = `https://app.txplus.com.co${this.router.url.replace("/app-mobile", "/app-mobiles")}`;
    }else {
      window.location.href = `https://app.txplus.com.co/app-mobiles`;
    }
    
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
