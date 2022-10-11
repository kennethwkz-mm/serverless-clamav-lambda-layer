import type {AWS} from '@serverless/typescript';
import * as dotenv from "dotenv";

import virusScan from "@functions/virus-scan";

dotenv.config({path: __dirname + `/${process.env.NODE_ENV}.env`});

const service = 'clamav-lambda-layer';
const serverlessConfiguration: AWS = {
    service: `${service}`,
    frameworkVersion: '3',
    useDotenv: true,

    plugins: [
        'serverless-webpack',
        'serverless-dotenv-plugin',
        'serverless-iam-roles-per-function'],
    provider: {
        name: 'aws',
        runtime: 'nodejs16.x',
        region: 'ap-southeast-2',
        httpApi: {
            cors: true,
        },
        apiGateway: {
            minimumCompressionSize: 1024,
            shouldStartNameWithService: true,
        },
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
    },
    functions: {
        virusScan
    },
    layers: {
        clamav: {
            path: 'layer'
        }
    },
    custom: {
        webpack: {
            webpackConfig: './webpack.config.js',
            includeModules: true,
        },
    },
};

module.exports = serverlessConfiguration;

