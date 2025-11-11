FROM registry.stibarc.com/sprucehttp:latest
RUN mkdir -p /var/www/web
COPY . /var/www/web
RUN rm -rf /var/www/web/cd
RUN rm -rf /var/www/web/.git
RUN rm -rf /var/www/web/.github
RUN rm -rf /var/www/web/Dockerfile
COPY ./cd/sprucehttp_config.json /etc/sprucehttp/config.json