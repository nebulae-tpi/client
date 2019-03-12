import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environment';
import { KeycloakOnLoad } from 'keycloak-js';

export function keycloakInitializer(keycloak: KeycloakService): () => Promise<any> {
      return (): Promise<any> => {
        return new Promise(async (resolve, reject) => {

          try {
            await keycloak.init({
              config: {
                  url: environment.keycloak.url,
                  realm: environment.keycloak.realm,
                  clientId: environment.keycloak.clientId
              },
              initOptions: {
                  onLoad: environment.keycloak.onLoad as KeycloakOnLoad,
                  checkLoginIframe: environment.keycloak.checkLoginIframe
              },
              bearerExcludedUrls: environment.keycloak.bearerExcludedUrls
          });
            resolve();
          } catch (error) {}

        });
      };
}
