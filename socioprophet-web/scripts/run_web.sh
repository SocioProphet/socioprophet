#!/usr/bin/env bash

# run client and server 
cd .. && cd server && (yarn run dev&) 
cd .. && cd client && yarn run start