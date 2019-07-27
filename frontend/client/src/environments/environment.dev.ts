export const environment = {
  production: true,
  keycloak: {
    url: 'https://lab.nebulae.nebulae.com.co/auth', // 'https://tpi-dev.nebulae.com.co/auth', //
    realm: 'TPI',
    clientId: 'CLIENT_APP', // 'CLIENT-APP-LOCAL',
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
      key: 'AIzaSyANnp365UIdC9Q4cf0F0HKashKZZNvIog0'//'AIzaSyByGMKwZIYXqcPONjNSX-KHJ9kbP5tBu5I'
    }
  }
};
