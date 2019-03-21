export const environment = {
  production: true,
  keycloak: {
    url: 'https://tpi.nebulae.com.co/auth',
    realm: 'TPI',
    clientId: 'CLIENT-APP',
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
          'https://tpi.nebulae.com.co/api/client-gateway/graphql/http',
        wsEndPoint: 'wss://tpi.nebulae.com.co/api/client-gateway/graphql/ws',
        graphiqlEndPoint:
          'https://tpi.nebulae.com.co/api/client-gateway/graphiql'
      }
    }
  }
};
