import { S3Client } from "@aws-sdk/client-s3";
import { execSync } from "node:child_process";

const DAEMON_STATE_RUN = 1;
const DAEMON_STATE_STOP = 0;
const FILE_STATUS_CLEAN = "CLEAN";
const FILE_STATUS_INFECTED = "INFECTED";
const FILE_STATUS_PROCESSING_ERROR = "PROCCESSING_ERROR";

const MAX_FILE_SIZE = 512 * 1024 * 1024;

let daemonState = DAEMON_STATE_STOP;
let retryDaemon = 0;

const s3 = new S3Client({});

const startDaemon = async () => {
  if (daemonState === DAEMON_STATE_RUN) {
    return;
  }

  retryDaemon++;

  execSync("rm -rf /tmp/*");

  try {
    execSync("./bin/clamd -c ./clamd.conf");
  } catch (err) {
    // sometimes deamon cannot verify clamav DB, so let's try few more times
    if (retryDaemon > 3) {
      retryDaemon = 0;
      throw err;
    }

    await startDaemon();
  }

  daemonState = DAEMON_STATE_RUN;
};

const handler = async (event, context) => {
  await startDaemon();

  let status;
  try {
    execSync(`./bin/clamdscan -c ./clamd.conf freshclam.conf`);
    status = FILE_STATUS_CLEAN;
  } catch (error) {
    status =
      error.status === 1 ? FILE_STATUS_INFECTED : FILE_STATUS_PROCESSING_ERROR;
  }

  return status;
};

export const virusScan = handler;
