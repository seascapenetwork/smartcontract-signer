#!/usr/bin/env node

/**
 * The signer runs the Message queries to listen for Messages from other services and returns the signed message with 
 * Private keys.
 * 
 * Requires the following Environment variables:
 * NETWORK_ID       - unique blockchain network id.
 * MQ_HOST          - The host of Rabbit MQ or other Message Broker.
 */
const chalk 		      = require("chalk");
const { fork }        = require('child_process');
const { connect, attachToQueue, QUEUE_TYPE, listenQueue } = require('./mq');
const { isSupportedCommand, SIGNER_START, SIGNER_STOP, SERVER_START, SERVER_STOP, KILL } = require('./cli/gateway-util');

let signer;
let server;
let signerScript = './src/signer.js';
let serverScript = './src/server.js';

(async () => {
  let conChannel;
  try {
    conChannel = await connect();
  } catch (error) {
    console.error(chalk.red(`Failed to connect to Message Queue Server`));
    process.exit(1);
  }

  await attachToQueue(conChannel.channel, QUEUE_TYPE.GATEWAY);

  await listenQueue(conChannel.channel, QUEUE_TYPE.GATEWAY, (content) => {
    console.warn(chalk.gray(" [*] Waiting for messages in %s. To exit press CTRL+C", QUEUE_TYPE.GATEWAY.queue));

    if (!content.command) {
      console.error(chalk.red(`Gateway: Missing command parameter`));
      return false;
    }

    if (!isSupportedCommand(content.command)) {
      console.error(chalk.red(`Gateway: unsupported ${command} command`));
      return false;
    }  

    if (content.command === SERVER_START) {
      if (server !== undefined) {
        console.error(chalk.red(`Gateway: Server is already running! Received SERVER_START signal`));
        return false;
      }
      
      server = fork(serverScript, ['child'], { });
      server.on('close', () => {
          console.warn(chalk.redBright(chalk.bold(`> Seascape Message Server`) + ` stopped!`));

          server = undefined;
      });

      return true;
    } else if (content.command === SERVER_STOP) {
      if (server === undefined) {
        console.error(chalk.red(`No running server. Received SERVER_STOP signal`));
        return false;
      }

      server.kill('SIGTERM');
      server = undefined;

      return true;
    } else if (content.command === SIGNER_START) {
      if (signer !== undefined) {
        console.error(chalk.red(`Received SIGNER_START signal`));
        return false;
      }
      
      signer = fork(signerScript, ['child'], { });

      signer.on('close', () => {
        console.warn(chalk.redBright(chalk.bold(`> Seascape Message Signer`) + ` stopped!`));

        signer = undefined;
      });

      return true;
    } else if (content.command === SIGNER_STOP) {
      if (signer === undefined) {
        console.error(chalk.red(`Received SIGNER_STOP signal`));
        return false;
      }

      signer.kill('SIGTERM');
      signer = undefined;

      return true;
    } else if (content.command === KILL) {
      console.warn(chalk.gray(`Killing the Gateway within 3 seconds!`));

      setTimeout(() => {
        conChannel.channel.close((error) => {
          if (error) {
            console.warn(chalk.red(error));
          }
        });
        conChannel.connection.close((error) => {
          if (error) {
            console.warn(error);
          } else {
            console.log(chalk.bold(`Gateway was killed!`));
          }
        });
      }, 3 * 1000);

      return true;
    } else {
      return false;
    }
  });
})();