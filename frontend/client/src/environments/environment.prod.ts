export const environment = {
  production: true,
  'keycloak': {
    'url': 'https://tpi.nebulae.com.co/auth',
    'realm': "TPI",
    'clientId': 'CLIENT-APP',
    "onLoad": "check-sso",
    'checkLoginIframe': false,
    'enableBearerInterceptor': true,
    'bearerExcludedUrls': [
      '/assets'
    ]
  },
};
