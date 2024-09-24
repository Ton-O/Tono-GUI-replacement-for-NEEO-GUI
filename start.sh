#!/bin/bash
#export NODE_OPTIONS=--max-old-space-size=8192
cp -r /etc/orgapp/* /app 
#sleep 15m
node  /app/StartServer.js