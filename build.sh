#!/bin/bash

rm -rf ./layer
mkdir layer

# ARM64 for M1
## https://hub.docker.com/_/amazonlinux/tags
# public.ecr.aws/amazonlinux/amazonlinux:2.0.20220912.1-arm64v8
docker build --platform linux/amd64 --progress=plain --no-cache -t clamav -f Dockerfile .
docker run --platform linux/amd64 --name clamav clamav
docker cp clamav:/home/build/clamav_lambda_layer.zip .
docker rm clamav
mv clamav_lambda_layer.zip ./layer

pushd layer || exit
unzip -n clamav_lambda_layer.zip
rm clamav_lambda_layer.zip
popd || exit
