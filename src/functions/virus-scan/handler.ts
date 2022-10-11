// https://aws.amazon.com/blogs/developer/virus-scan-s3-buckets-with-a-serverless-clamav-based-cdk-construct/
// CDK competes with serverless

// https://dev.to/sutt0n/using-a-lambda-container-to-scan-files-with-clamav-via-serverless-2a5g
import * as fs from "fs";

const {execSync} = require("child_process");
const {unlinkSync} = require("fs");
// Node is readable.
import { Readable } from 'stream';
import {GetObjectCommand, GetObjectCommandOutput, PutObjectTaggingCommand} from "@aws-sdk/client-s3";
import {s3Client} from "../../clients/s3Client";

const  writeFile = async (key: string, readable: Readable) => {
    const output = fs.createWriteStream(`/tmp/${key}`)
    for await (const chunk of readable) {
        output.write(chunk)
    }
    output.close();
}
export const virusScan = async (event) => {
    if (!event.Records) {
        console.log("Not an S3 event invocation!");
        return;
    }

    for (const record of event.Records) {
        if (!record.s3) {
            console.log("Not an S3 Record!");
            continue;
        }
        const getObjectCommand = new GetObjectCommand({
            Bucket: record.s3.bucket.name,
                Key: record.s3.object.key
        })
        const s3Object: GetObjectCommandOutput = await s3Client.send(getObjectCommand);
        const body = s3Object.Body as Readable;
        await writeFile(record.s3.object.key, body);

        try {
            const scanStatus = execSync(`clamscan --database=/opt/opt/var/lib/clamav /tmp/${record.s3.object.key}`);
            console.log(`Scan status is ${scanStatus}`);
            const putObjectTaggingCommand = new PutObjectTaggingCommand({
                Bucket: record.s3.bucket.name,
                Key: record.s3.object.key,
                Tagging: {
                    TagSet: [
                        {
                            Key: 'av-status',
                            Value: 'clean'
                        }
                    ]
                }
            })
            await s3Client.send(putObjectTaggingCommand);
        } catch (err) {
            if (err.status === 1) {
                // Delete the file. Make sure people can't download it.
                const putObjectTaggingCommand = new PutObjectTaggingCommand({
                    Bucket: record.s3.bucket.name,
                    Key: record.s3.object.key,
                    Tagging: {
                        TagSet: [
                            {
                                Key: 'av-status',
                                Value: 'dirty'
                            }
                        ]
                    }
                })
                await s3Client.send(putObjectTaggingCommand);
            }
        }

        // delete the temp file
        unlinkSync(`/tmp/${record.s3.object.key}`);
    }
}

export const main = virusScan;

/*
2022-09-24T04:57:13.319Z	a57bdd96-bb4d-4a3c-bff0-226eed1171c1	ERROR	Invoke Error 	{"errorType":"TypeError","errorMessage":"The \"data\" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received an instance of IncomingMessage","code":"ERR_INVALID_ARG_TYPE","stack":["TypeError [ERR_INVALID_ARG_TYPE]: The \"data\" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received an instance of IncomingMessage","    at writeFileSync (node:fs:2163:5)","    at Runtime.s [as handler] (/var/task/src/functions/virus-scan/handler.js:1:2699)","    at processTicksAndRejections (node:internal/process/task_queues:96:5)"]}

 yieldUint8Chunks

 https://stackoverflow.com/questions/66881761/type-error-property-pipe-does-not-exist-on-type-readablestreamuint8array
 */
