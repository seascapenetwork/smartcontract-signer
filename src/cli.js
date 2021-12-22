#!/usr/bin/env node

/**
 * CLI is the Command Line Interface of the Blockchain Syncer.
 * Basically its the manager of Eventeum.
 * @author Medet Ahmetson <admin@blocklords.io>
 */

const { SIGNER_START, SIGNER_STOP, SERVER_START, SERVER_STOP, KILL } = require('./utils/gateway');
const { SIGNER_ADD, SIGNER_REMOVE, SIGNER_LIST } = require('./utils/signer');
const { sendOverMq, sendOverRpc, QUEUE_TYPE } = require('./mq');
const commandLineArgs               = require('command-line-args');
const { read, create, del }         = require('./utils/wallet');
const { listEncryptedWallets }      = require('./private-path');
const chalk                         = require('chalk');

// Clean the screen before executing the CLI
require('clear')(); 

/**
 * Exit with the delay from the background
 * @param {number} delay in seconds 
 * @param {string} message to show in case of the error
 * @returns 
 */
let exit = (delay, message) => {
    if (delay === undefined) {
        delay = 500;    // default delay is 0.5 seconds
    } else {
        delay *= 1000;
    }

    if (delay === 0) {
        if (message) {
            console.error(chalk.redBright(message));
            process.exit(1);
        } else {
            process.exit(0);
        }
    } else {
        setTimeout(() => {
            if (message) {
                console.error(chalk.redBright(message));
                process.exit(1);
            } else {
                process.exit(0);
            }
        }, delay);
    }
}

// first - parse the main command
const mainDefinitions   = [ { name: 'command', defaultOption: true } ];
const mainOptions       = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
const argv              = mainOptions._unknown || [];

(async () => {
    "use strict";

    if (mainOptions.command === 'gate-kill') {
        console.log(chalk.gray(`Killing the Gateway`));
        
        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: KILL});
        if (res === true) {
            console.log(chalk.green(`Kill Signal was sent to Gateway!`));
        }

        // Just need to delay exit to close the Message Queue server.
        exit();
    } else if (mainOptions.command === 'server-start') {
        console.log(chalk.gray(`Starting the server`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SERVER_START});
        if (res === true) {
            console.log(chalk.green(`Smartcontract Signer starting signal was sent to Gateway!`));
        }
        
        exit();
    } else if (mainOptions.command === 'server-stop') {
        console.log(chalk.gray(`Stopping the server`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SERVER_STOP});
        if (res === true) {
            console.log(chalk.green(`Smartcontract Signer stopping signal was sent to Gateway!`));
        }
        
        exit();
    } else if (mainOptions.command === 'signer-start') {
        console.log(chalk.gray(`Start the signer`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SIGNER_START});
        if (res === true) {
            console.log(chalk.green(`Smartcontract Signer starting signal was sent to Gateway!`));
        }
        
        exit();
    } else if (mainOptions.command === 'signer-stop') {
        console.log(chalk.gray(`Stop the signer`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SIGNER_STOP});
        if (res === true) {
            console.log(chalk.green(`Smartcontract Signer stopping signal was sent to Gateway!`));
        }
        
        exit();
    } else if (mainOptions.command === 'signer-add') {
        console.log(chalk.gray(`Decrypt the wallet and load into the signer`));

        let readResult;
        try {
            readResult = await read();
        } catch (error) {
            exit(0.5, "Failed to read the info from user");
        }

        let overRpcParams = {command: SIGNER_ADD, path: readResult.path, passphrase: readResult.passphrase};
        let res = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, (content) => {
            if (content.error) {
                console.error(chalk.redBright(content.message));
            } else {
                console.log(chalk.green(`Smartcontract Signer add signal was sent to Gateway!`));
            }

            exit();
        });
        if (res !== true) {
            console.error(chalk.redBright(res));
        }
        
        exit(10, `Signer didn't response within the 10 seconds! Please check the Gateway logs.`);
    } else if (mainOptions.command === 'signer-remove') {
        console.log(chalk.gray(`Unloading the wallet from the signer!`));

        const listDefinitions = [
            { name: 'address', type: String },
            { name: 'path', type: String }
        ]

        let listOptions;
        try {
            listOptions = commandLineArgs(listDefinitions, { argv })
        } catch (error) {
            console.log(chalk.yellow(error.toString()));
            process.exit(1);
        }

        if (Object.keys(listOptions).length === 0) {
            exit(0.1, `--address or --path option was not given.`);
            // todo show the loaded wallets
        } 
        
        let overRpcParams = {command: SIGNER_REMOVE, path: listOptions['path'], address: listOptions['address']};
        let res = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, (content) => {
            if (content.error) {
                console.error(chalk.redBright(content.message));
            } else {
                console.log(chalk.green(`Wallet was successfully unloaded from the Signer!`));
            }

            exit();
        });
        if (res !== true) {
            console.error(chalk.redBright(res));
        }
        
        exit(10, `Signer didn't response within the 10 seconds! Please check the Gateway logs.`);
    } else if (mainOptions.command === 'wallet-list') {
        const listDefinitions = [
            { name: 'all', type: Boolean },
            { name: 'unload', type: Boolean }
        ]

        let listOptions;
        try {
            listOptions = commandLineArgs(listDefinitions, { argv })
        } catch (error) {
            exit(0, error.toString());
        }

        if (Object.keys(listOptions).length === 0) {
            console.log(chalk.gray(chalk.bold(`DECRYPTED`) + ` list of the wallets loaded into the Smartcontract Signer`));

            let overRpcParams = {command: SIGNER_LIST};
            let res = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, (content) => {
                console.log(chalk.green(`Loaded ${content.length} wallets!`));

                for (var i in content) {
                    let wallet = content[i];
                    console.log(`  ${parseInt(i) + 1}. ` + chalk.blueBright(wallet.address) + ` in ${wallet.path}.json`);
                }

                exit();
            });
            if (res !== true) {
                console.error(chalk.redBright(res));
            }
            
            exit(10, `Signer didn't response within the 10 seconds! Please check the Gateway logs.`);
        } else if (listOptions['all']) {
            console.log(chalk.gray(chalk.bold(`ENCRYPED`) + ` list of all wallets`));

            let encryptedWallets
            try {
                encryptedWallets = await listEncryptedWallets();
            } catch (error) {
                exit(0, `Failed to fetch the encrypted wallets list`);
            }

            console.log(chalk.bold(`Found ${encryptedWallets.length} wallets!`))
            for (var i in encryptedWallets) {
                console.log(` ${parseInt(i) + 1}. ${encryptedWallets[i]}`);
            }

            exit();
        } else if (listOptions['unload']) {
            console.log(chalk.gray(chalk.bold(`ENCRYPED`) + ` list of all wallets that are not in Smartcontract Signer`));

            let encryptedWallets
            try {
                encryptedWallets = await listEncryptedWallets();
            } catch (error) {
                exit(0, `Failed to fetch the encrypted wallets list`);
            }

            let overRpcParams = {command: SIGNER_LIST};
            let res = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, async (content) => {
                let unloaded = [];

                for (var encryptedPath of encryptedWallets) {
                    let loaded = false;
                    for (var decrypted of content) {
                        if (decrypted.path + '.json' == encryptedPath) {
                            loaded = true;
                            break;
                        }
                    }

                    if (!loaded) {
                        unloaded.push(encryptedPath);
                    }
                }

                console.log(chalk.bold(`Found ${unloaded.length} wallets!`))
                for (var i in unloaded) {
                    console.log(` ${parseInt(i) + 1}. ${unloaded[i]}`);
                }

                exit();
            });
            if (res !== true) {
                console.error(chalk.redBright(res));
            }
            
            exit(10, `Signer didn't response within the 10 seconds! Please check the Gateway logs.`);
        } else {
            exit(0, `Unsupported option`);
        }
    } else if (mainOptions.command === 'wallet-create') {
        console.log(chalk.gray(`Creating a new encrypted Wallet!`));

        let result;
        try {
            result = await create();
        } catch (error) {
            exit(0.5, "Failed to create encrypted file based on the user input");
        }

        console.log(chalk.blueBright(`Created an encrypted wallet file!`))
        exit(0.5);
    } else if (mainOptions.command === 'wallet-delete') {
        console.log(chalk.gray(`Deleting a new encrypted Wallet!`));

        let result;
        try {
            result = await del();
        } catch (error) {
            exit(0.5, "Failed to delete the encrypted file based on the user input");
        }

        console.log(chalk.blueBright(`Deleted an encrypted wallet file!`))
        exit(0.5);
    } else {
        if (mainDefinitions.command === undefined) {
            console.log(chalk.red(`Missing the command`));
        } else {
            console.log(chalk.red(`Command '${mainDefinitions.command}' is unrecognized`));
        }

        console.log(chalk.grey(
            chalk.bold(`The supported commands:\n\n`) + 
            chalk.bold(`Gateway\n`) + 
            `    ` + chalk.blueBright(`gate-kill`) + `    - shuts down both server and the signer.` +
            chalk.bold(`\nServer\n`) + 
            `    ` + chalk.blueBright(`server-start`) + ` - enables to receive messages from outside to sign by privatekeys.\n` +
            `                                           - It is running as the detached child process.\n` +
            `    ` + chalk.blueBright(`server-stop`) + `  - stops the server, preventing to sign messages..\n` +
            `                                           - Sends the Message to the server to shut it down.\n` +
            chalk.bold(`\nSigner\n`) + 
            `    ` + chalk.blueBright(`signer-start`) + ` - imports the encrypted wallets from /private folder,\n` +
            `                                           - and enables them to the server,\n` +
            `                                           - It is running as the detached child process.\n` +
            `    ` + chalk.blueBright(`signer-stop`) + `  - prevents from signing any message.\n` +
            `    ` + chalk.blueBright(`signer-add`) + `   - decrypted wallet is added to the signer.\n` +
            `    ` + chalk.blueBright(`signer-remove`) + `- erases from signer's list in the signer.\n` +
            chalk.bold(`\Wallet\n`) + 
            `    ` + chalk.blueBright(`wallet-list`) + `  - shows list of loaded encrypted wallets.\n` +
            `        ` + chalk.grey(`The following arguments are supported:`) + '\n' +
            `        ` + chalk.grey(chalk.bold('--all       ') + `argument lists all wallet names in the /private folder.`) + `\n` +
            `        ` + chalk.grey(chalk.bold('--unloaded  ') + `unloaded shows the list of wallets that are not loaded.`) + `\n` +
            `    ` + chalk.blueBright(`wallet-create`) + `- adds the encrypted wallet into the /private folder.\n` +
            `    ` + chalk.blueBright(`wallet-delete`) + `- removes the encrypted wallet from the /private directory.\n`
        ));

        exit();
    }
})();
