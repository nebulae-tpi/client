import { Component, OnInit } from '@angular/core';
import { ServiceService } from '../../service.service';
import { ServiceState } from '../../service-state';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-request-button',
  templateUrl: './request-button.component.html',
  styleUrls: ['./request-button.component.scss']
})
export class RequestButtonComponent implements OnInit {

  constructor(private serviceService: ServiceService, private keycloakService: KeycloakService) { }

  ngOnInit() {
  }

  async requestTaxi() {
    this.serviceService.publishServiceChanges({ state: ServiceState.REQUEST });
    await this.keycloakService.getToken();
  }



}
