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
  hrefMobileToken = '';
  constructor(
    private menuService: MenuService,
    private serviceService: ServiceService,
    private location: Location,
    private router: Router,
    private snackBar: MatSnackBar,

  ) { }

  ngOnInit() {
    this.hrefMobileToken = window.location.href.replace("/app-mobile/?state","/appmobiles/?state");
    console.log("INGRES ON IF ===> "+ this.hrefMobileToken);
    setTimeout(()=>{
      console.log("INGRES EJEXUTA TIMEOUT 2222222222222222222");
        const element: HTMLElement = document.getElementById("redirectB") as HTMLElement;
        element.click();  
  }, 500);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
  }


  redirectAppMobile() {
    // const element: HTMLElement = document.getElementById("redirectA") as HTMLElement;
    // element.click();  
  
    
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
