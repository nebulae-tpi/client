export const environment = {
  production: true,
  keycloak: {
    url:  'https://tpi-dev.nebulae.com.co/auth', // 'https://lab.nebulae.nebulae.com.co/auth'
    realm: 'TPI',
    clientId: 'CLIENT-APP-LOCAL', // 'CLIENT_APP'
    onLoad: 'check-sso',
    checkLoginIframe: false,
    enableBearerInterceptor: true,
    bearerExcludedUrls: [
      '/assets'
    ]
  },
  api: {
    gateway: {
      graphql: {
        httpEndPoint:
          'https://tpi-dev.nebulae.com.co/api/client-gateway/graphql/http',
        wsEndPoint: 'wss://tpi-dev.nebulae.com.co/api/client-gateway/graphql/ws',
        graphiqlEndPoint:
          'https://tpi-dev.nebulae.com.co/api/client-gateway/graphiql'
      }
    }
  },
  google: {
    maps: {
      key: 'AIzaSyBDPax-qkTCgrJRfSzFbmGPLRDRjuiod_k'
    }
  }
};
