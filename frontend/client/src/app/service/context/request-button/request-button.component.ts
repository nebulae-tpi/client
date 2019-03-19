import { Component, OnInit } from '@angular/core';
import { ServiceService } from '../../service.service';
import { ServiceState } from '../../service-state';

@Component({
  selector: 'app-request-button',
  templateUrl: './request-button.component.html',
  styleUrls: ['./request-button.component.scss']
})
export class RequestButtonComponent implements OnInit {

  constructor(private serviceService: ServiceService) { }

  ngOnInit() {
  }

  requestTaxi() {
    this.serviceService.currentService$.next({state: ServiceState.REQUEST});
  }



}
