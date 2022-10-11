import {handlerPath} from '@libs/handlerResolver';

// suffix: can be used to filter the files the event operates on
// https://www.serverless.com/framework/docs/providers/aws/events/s3
export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    timeout: 300,
    events: [{
        s3: {
            bucket: `${process.env.SLS_ENV}-winner-identity-202107060917`,
            event: 's3:ObjectCreated:*',
            existing: true,
            forceDeploy: true
        }
    }
    ],
    layers: [{Ref: 'ClamavLambdaLayer'}],
    environment: {
        REGION: process.env.REGION
    },
    iamRoleStatementsName: `winpay-admin-virus-scan-role-${process.env.SLS_ENV}`,
    iamRoleStatements: [
        {
            Effect: "Allow",
            Action: [
                "s3:GetObject",
                "s3:PutObjectTagging",
                "s3:DeleteObject",
            ],
            Resource: `arn:aws:s3:::${process.env.SLS_ENV}-winner-identity-202107060917/*`
        }, {
            Effect: "Allow",
            Action: [
                "dynamodb:GetItem",
            ],
            Resource: `arn:aws:dynamodb:${process.env.REGION}:070222716272:table/${process.env.SLS_ENV}-WINNER`
        },
    ]
}
