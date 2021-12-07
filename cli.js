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
const { sendOverMq, QUEUE_TYPE } = require('./src/mq');
const network = {};//require('./src/network');
const chalk = require('chalk');
const clear = require('clear');
 
clear();

/* first - parse the main command */
const mainDefinitions = [
    { name: 'command', defaultOption: true }
];
   
const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: false })
const argv = mainOptions._unknown || [];

(async () => {
    /* second - parse the merge command options */
    if (mainOptions.command === 'gate-kill') {
        console.log(chalk.gray(`Killing the Gateway`));
        
        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: KILL});
        if (res === true) {
            console.log(chalk.green(`Kill Signal was sent to Gateway!`));
        }
        
        process.exit(0);
    } else if (mainOptions.command === 'server-start') {
        console.log(chalk.gray(`Starting the server`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SERVER_START});
        if (res === true) {
            console.log(chalk.green(`Seascape Message Signer starting signal was sent to Gateway!`));
        }
        
        process.exit(0);
    } else if (mainOptions.command === 'server-stop') {
        console.log(chalk.gray(`Stopping the server`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SERVER_STOP});
        if (res === true) {
            console.log(chalk.green(`Seascape Message Signer stopping signal was sent to Gateway!`));
        }
        
        process.exit(0);
    } else if (mainOptions.command === 'signer-start') {
        console.log(chalk.gray(`Start the signer`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SIGNER_START});
        if (res === true) {
            console.log(chalk.green(`Seascape Message Signer stopping signal was sent to Gateway!`));
        }
        
        process.exit(0);
    } else if (mainOptions.command === 'signer-stop') {
        console.log(chalk.gray(`Stop the signer`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SIGNER_STOP});
        if (res === true) {
            console.log(chalk.green(`Seascape Message Signer stopping signal was sent to Gateway!`));
        }
        
        process.exit(0);
    } else if (mainOptions.command === 'signer-add') {
        console.log(chalk.gray(`Decrypt the wallet and load into the signer`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SIGNER_STOP});
        if (res === true) {
            console.log(chalk.green(`Seascape Message Signer stopping signal was sent to Gateway!`));
        }
        
        process.exit(0);
    } else if (mainOptions.command === 'signer-remove') {
        console.log(chalk.gray(`Remove from the signer's list the wallet`));

        let res = await sendOverMq(QUEUE_TYPE.GATEWAY, {command: SIGNER_STOP});
        if (res === true) {
            console.log(chalk.green(`Seascape Message Signer stopping signal was sent to Gateway!`));
        }
        
        process.exit(0);
    } else if (mainOptions.command === 'wallet-list') {
        const listDefinitions = [
            { name: 'all', alias: 'a', type: Boolean, defaultOption: false },
            { name: 'unloaded', alias: 'u', type: Boolean, defaultOption: false }
        ]


        const listOptions = commandLineArgs(listDefinitions, { argv })
        if (Object.keys(listOptions).length === 0) {
            // todo show the loaded wallets
        } else if (listOptions['all']) {
            // todo show all wallets in the /private directory
        } else if (listOptions['u']) {
            // todo show all unloaded wallets
        } else {
            // throw an error for undetected option
        }
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
        process.exit(1);
    }
})();


return;
