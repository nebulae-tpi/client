import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environment';
import { KeycloakOnLoad } from 'keycloak-js';

export function keycloakInitializer(keycloak: KeycloakService): () => Promise<any> {
      return (): Promise<any> => {
        return new Promise(async (resolve, reject) => {
          try {
            const token = localStorage.getItem('kc_token');
            const refreshToken = localStorage.getItem('kc_refreshToken');
            console.log('Init token => ', token);
            console.log('Init refreshToken => ', refreshToken);
            const success = await keycloak.init({
              config: {
                  url: environment.keycloak.url,
                  realm: environment.keycloak.realm,
                  clientId: environment.keycloak.clientId,
              },
              initOptions: {
                  onLoad: environment.keycloak.onLoad as KeycloakOnLoad,
                  checkLoginIframe: environment.keycloak.checkLoginIframe,
                  token,
                  refreshToken
              },
              bearerExcludedUrls: environment.keycloak.bearerExcludedUrls
          });
            if (success) {
              console.log('Success token => ', keycloak.getKeycloakInstance().token);
              console.log('Success refreshToken => ', keycloak.getKeycloakInstance().refreshToken);
              localStorage.setItem('kc_token', keycloak.getKeycloakInstance().token);
              localStorage.setItem('kc_refreshToken', keycloak.getKeycloakInstance().refreshToken);
            }

            resolve();
          } catch (error) {}

        });
      };
}
