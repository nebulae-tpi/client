import { Component, OnInit } from '@angular/core';
import { ServiceService } from '../../service.service';
import { ServiceState } from '../../service-state';
import { KeycloakService } from 'keycloak-angular';
import { GatewayService } from 'src/app/api/gateway.service';

@Component({
  selector: 'app-request-button',
  templateUrl: './request-button.component.html',
  styleUrls: ['./request-button.component.scss']
})
export class RequestButtonComponent implements OnInit {
  constructor(
    private serviceService: ServiceService,
    private keycloakService: KeycloakService,
    private gateway: GatewayService
  ) {}

  ngOnInit() {}

  async requestTaxi() {
    this.serviceService.publishServiceChanges({ state: ServiceState.REQUEST });
    if (!this.gateway.checkIfUserLogger()) {
      await this.keycloakService.login({ scope: 'offline_access' });
    }
    // await this.keycloakService.getToken();
  }
}
