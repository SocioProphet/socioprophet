#!/usr/bin/env bash

#deploy socioprophet-web client
cd .. && cd client && docker build -t gcr.io/socioprophet-web/sp-client:release . && docker push gcr.io/socioprophet-web/sp-client:release