import {
  GetObjectCommand,
  PutObjectTaggingCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { execSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";

const s3 = new S3Client({});

export async function virusScan(event, context) {
  if (!event.Records) {
    console.log("Not an S3 event invocation!");
    return;
  }

  for (const record of event.Records) {
    if (!record.s3) {
      console.log("Not an S3 Record!");
      continue;
    }

    const key = decodeURIComponent(record.s3.object.key.replace(/\+g/, " "));

    console.log("getting the file", key, record);

    // get the file
    const s3Object = await s3.send(
      new GetObjectCommand({
        Bucket: record.s3.bucket.name,
        Key: record.s3.object.key,
      })
    );

    console.log("got the file", record.s3.object.key);

    // write file to disk
    writeFileSync(`/tmp/${record.s3.object.key}`, s3Object.Body);

    console.log("wrote the file");

    try {
      // scan it
      execSync(
        `./bin/clamscan --database=./var/lib/clamav /tmp/${record.s3.object.key}`
      );

      console.log("updating tag to clean");

      await s3.send(
        new PutObjectTaggingCommand({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key,
          Tagging: {
            TagSet: [
              {
                Key: "av-status",
                Value: "clean",
              },
            ],
          },
        })
      );

      console.log("updated tag to clean");
    } catch (err) {
      console.log("err", err);
      if (err.status === 1) {
        // tag as dirty, OR you can delete it
        await s3.send(
          new PutObjectTaggingCommand({
            Bucket: record.s3.bucket.name,
            Key: record.s3.object.key,
            Tagging: {
              TagSet: [
                {
                  Key: "av-status",
                  Value: "dirty",
                },
              ],
            },
          })
        );
      }
    }

    // delete the temp file
    unlinkSync(`/tmp/${record.s3.object.key}`);
  }
}
