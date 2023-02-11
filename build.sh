#!/bin/bash

rm -rf ./layer
mkdir layer

docker build --platform linux/amd64 -t clamav -f Dockerfile .