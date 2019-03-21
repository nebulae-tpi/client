ARG NGINX_CONF_FILE_INPUT=nginx.conf.prod
FROM nginx:1.14-alpine-perl
COPY nginx.conf.dev /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html/app