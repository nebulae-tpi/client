export const environment = {
  production: true,
  keycloak: {
    url: 'http://localhost:8080/auth',
    realm: 'DEV_TPI',
    clientId: 'CLIENT-APP',
    onLoad: 'check-sso',
    checkLoginIframe: false,
    enableBearerInterceptor: true,
    bearerExcludedUrls: [
      '/assets'
    ]
  },
};
