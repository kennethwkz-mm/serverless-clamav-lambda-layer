## AWS ClamAV Layer & a service using it to scan files
```
git clone https://github.com/sutt0n/serverless-clamav-layer
./build.sh
sls deploy
```

## Mac M2

Docker file has the platform specified. Without this the packages are not found

   FROM --platform=linux/amd64 amazonlinux:2 

## Unit Tests
There's only one unit test for our handler, but to run it you'll need to install the `devDependencies` 

```
npm i
npm run test
```
