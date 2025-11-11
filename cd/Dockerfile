FROM registry.stibarc.com/sprucehttp:latest
RUN mkdir -p /var/www/web
RUN mkdir -p /var/www/probes
COPY . /var/www/web
COPY ./cd/liveness.txt /var/www/probes
COPY ./cd/readiness.txt /var/www/probes
RUN rm -rf /var/www/web/cd
RUN rm -rf /var/www/web/.git
RUN rm -rf /var/www/web/.github
COPY ./cd/sprucehttp_config.json /etc/sprucehttp/config.json