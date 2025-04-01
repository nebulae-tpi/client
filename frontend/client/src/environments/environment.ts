// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  manizalesBusinessId: 'b19c067e-57b4-468f-b970-d0101a31cacb',
  caliBusinessId: '75cafa6d-0f27-44be-aa27-c2c82807742d',
  nebulaBusinessId: 'bf2807e4-e97f-43eb-b15d-09c2aff8b2ab',
  keycloak: {
    url: 'https://tpi.nebulae.com.co/auth', // 'https://lab.nebulae.com.co/auth', //
    realm: 'TPI',
    clientId: 'CLIENT-APP', // 'CLIENT_APP'
    onLoad: 'check-sso',
    checkLoginIframe: false,
    enableBearerInterceptor: true,
    bearerExcludedUrls: ['/assets']
  },
  api: {
    gateway: {
      graphql: {
        httpEndPoint:
          'https://tpi.nebulae.com.co/api/client-gateway/graphql/http',
        wsEndPoint: 'wss://tpi.nebulae.com.co/api/client-gateway/graphql/ws',
        graphiqlEndPoint:
          'https://tpi.nebulae.com.co/api/client-gateway/graphiql'
      }
    }
  },
  google: {
    maps: {
      key: 'AIzaSyC1VkMKnBB_TATeaszTe_a8phyo-B8DSVg'
    }
  }
};


/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
