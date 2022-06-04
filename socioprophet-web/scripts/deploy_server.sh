#!/usr/bin/env bash

#deploy socioprophet-web server
cd .. && cd server && docker build -t gcr.io/socioprophet-web/sp-server:release . && docker push gcr.io/socioprophet-web/sp-server:release

