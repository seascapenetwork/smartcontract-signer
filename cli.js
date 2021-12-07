#!/usr/bin/env node

/**
 * CLI is the Command Line Interface of the Blockchain Syncer.
 * Basically its the manager of Eventeum.
 * 
 * Features:
 * Multi-blockchain.
 * Register Contracts.
 * Add contract events to the Eventeum.
 * Listen to the contract events and redirect to supported Seascape Backend.
 */
const commandLineArgs = require('command-line-args');
const { SIGNER_START, SIGNER_STOP, SERVER_START, SERVER_STOP, KILL } = require('./src/cli/gateway-util');
const { read } = require('./src/cli/wallet-util');
const { sendOverMq, sendOverRpc, QUEUE_TYPE } = require('./src/mq');
const { listEncryptedWallets } = require('./src/private-path');
const chalk = require('chalk');
const clear = require('clear');
const { SIGNER_ADD, SIGNER_REMOVE, SIGNER_LIST } = require('./src/cli/signer-util');
 
clear();

/* first - parse the main command */
const mainDefinitions = [
    { name: 'command', defaultOption: true }
];
   
const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
const argv = mainOptions._unknown || [];

(async () => {
    /* second - parse the merge command options */
    if (mainOptions.command === 'gate-kill') {
        console.log(chalk.gray(`Killing the Gateway`));
        
        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: KILL});
        if (res === true) {
            console.log(chalk.green(`Kill Signal was sent to Gateway!`));
        }
        
        setTimeout(() => {
            process.exit(0);
        }, 500);
    } else if (mainOptions.command === 'server-start') {
        console.log(chalk.gray(`Starting the server`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SERVER_START});
        if (res === true) {
            console.log(chalk.green(`Seascape Message Signer starting signal was sent to Gateway!`));
        }
        
        setTimeout(() => {
            process.exit(0);
        }, 500);
    } else if (mainOptions.command === 'server-stop') {
        console.log(chalk.gray(`Stopping the server`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SERVER_STOP});
        if (res === true) {
            console.log(chalk.green(`Seascape Message Signer stopping signal was sent to Gateway!`));
        }
        
        setTimeout(() => {
            process.exit(0);
        }, 500);
    } else if (mainOptions.command === 'signer-start') {
        console.log(chalk.gray(`Start the signer`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SIGNER_START});
        if (res === true) {
            console.log(chalk.green(`Seascape Message Signer starting signal was sent to Gateway!`));
        }
        
        setTimeout(() => {
            process.exit(0);
        }, 500);
    } else if (mainOptions.command === 'signer-stop') {
        console.log(chalk.gray(`Stop the signer`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SIGNER_STOP});
        if (res === true) {
            console.log(chalk.green(`Seascape Message Signer stopping signal was sent to Gateway!`));
        }
        
        process.exit(0);
    } else if (mainOptions.command === 'signer-add') {
        console.log(chalk.gray(`Decrypt the wallet and load into the signer`));

        let readResult;
        try {
            readResult = await read();
        } catch (error) {
            setTimeout(() => {
                process.exit(1);
            }, 500);
        }

        let overRpcParams = {command: SIGNER_ADD, path: readResult.path, passphrase: readResult.passphrase};
        let res = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, (content) => {
            if (content.error) {
                console.error(chalk.redBright(content.message));
            } else {
                console.log(chalk.green(`Seascape Message Signer add signal was sent to Gateway!`));
            }

            setTimeout(() => {
                process.exit(0);
            }, 500);
        });
        if (res !== true) {
            console.error(chalk.redBright(res));
        }
        
        setTimeout(() => {
            console.warn(chalk.yellowBright(`Signer didn't response within the 10 seconds! Please check the Gateway logs.`));
            process.exit(0);
        }, 10000);
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
            console.log(chalk.red(`--address or --path option was not given.`));
            process.exit(1);
            // todo show the loaded wallets
        } 
        
        let overRpcParams = {command: SIGNER_REMOVE, path: listOptions['path'], address: listOptions['address']};
        let res = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, (content) => {
            if (content.error) {
                console.error(chalk.redBright(content.message));
            } else {
                console.log(chalk.green(`Wallet was successfully unloaded from the Signer!`));
            }

            setTimeout(() => {
                process.exit(0);
            }, 500);
        });
        if (res !== true) {
            console.error(chalk.redBright(res));
        }
        
        setTimeout(() => {
            console.warn(chalk.yellowBright(`Signer didn't response within the 10 seconds! Please check the Gateway logs.`));
            process.exit(0);
        }, 10000);
    } else if (mainOptions.command === 'wallet-list') {
        const listDefinitions = [
            { name: 'all', type: Boolean },
            { name: 'unload', type: Boolean }
        ]

        let listOptions;
        try {
            listOptions = commandLineArgs(listDefinitions, { argv })
        } catch (error) {
            console.log(chalk.yellow(error.toString()));
            process.exit(1);
        }
        if (Object.keys(listOptions).length === 0) {
            console.log(chalk.gray(chalk.bold(`DECRYPTED`) + ` list of the wallets loaded into the Seascape Message Signer`));

            let overRpcParams = {command: SIGNER_LIST};
            let res = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, (content) => {
                console.log(chalk.green(`Loaded ${content.length} wallets!`));

                for (var i in content) {
                    let wallet = content[i];
                    console.log(`  ${parseInt(i) + 1}. ` + chalk.blueBright(wallet.address) + ` in ${wallet.path}.json`);
                }

                setTimeout(() => {
                    process.exit(0);
                }, 500);
            });
            if (res !== true) {
                console.error(chalk.redBright(res));
            }
            
            setTimeout(() => {
                console.warn(chalk.yellowBright(`Signer didn't response within the 10 seconds! Please check the Gateway logs.`));
                process.exit(0);
            }, 10000);
        } else if (listOptions['all']) {
            console.log(chalk.gray(chalk.bold(`ENCRYPED`) + ` list of all wallets`));

            let encryptedWallets
            try {
                encryptedWallets = await listEncryptedWallets();
            } catch (error) {
                console.error(chalk.redBright(`Failed to fetch the encrypted wallets list`));
                process.exit(1);
            }

            console.log(chalk.bold(`Found ${encryptedWallets.length} wallets!`))
            for (var i in encryptedWallets) {
                console.log(` ${parseInt(i) + 1}. ${encryptedWallets[i]}`);
            }

            process.exit(0);
        } else if (listOptions['unload']) {
            console.log(chalk.gray(chalk.bold(`ENCRYPED`) + ` list of all wallets that are not in Seascape Message Signer`));

            let encryptedWallets
            try {
                encryptedWallets = await listEncryptedWallets();
            } catch (error) {
                console.error(chalk.redBright(`Failed to fetch the encrypted wallets list`));
                process.exit(1);
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

                setTimeout(() => {
                    process.exit(0);
                }, 500);
            });
            if (res !== true) {
                console.error(chalk.redBright(res));
            }
            
            setTimeout(() => {
                console.warn(chalk.yellowBright(`Signer didn't response within the 10 seconds! Please check the Gateway logs.`));
                process.exit(0);
            }, 10000);
        } else {
            // throw an error for undetected option
            console.log(chalk.redBright(`Unsupported option`));

            process.exit(1);
        }

    } else if (mainOptions.command === 'wallet-create') {
    } else {
        console.log(mainDefinitions)
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
        setTimeout(() => {
            process.exit(0);
        }, 500);
    }
})();
