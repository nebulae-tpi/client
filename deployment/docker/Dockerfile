ARG NGINX_CONF_FILE_INPUT=nginx.conf.prod
FROM nginx:1.14-alpine-perl
ENV NGINX_CONF_FILE=$NGINX_CONF_FILE_INPUT
COPY $NGINX_CONF_FILE /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html/app