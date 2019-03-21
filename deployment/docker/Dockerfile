FROM nginx:1.14-alpine-perl
ARG NGINX_CONF_FILE_INPUT=nginx.conf.prod
COPY $NGINX_CONF_FILE_INPUT /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html/app