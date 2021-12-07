const fs = require("fs");

const inquirer  = require("inquirer");
const chalk     = require("chalk");
const { privatePath } = require("./../private-path");
const clui = require('clui');
const Spinner = clui.Spinner;

const { ethers } = require("ethers");

/**
 * Decrypt the Keystore wallet with the given password. If failed to decrypt, then return undefined.
 * @param {string} json 
 * @param {string} password 
 * @param {clui.Spinner} spinner 
 * @returns ethers.Wallet
 * @warning exits on error.
 */
let decryptWallet = async (json, password, spinner) => {
    if (spinner) {
        spinner.start();
    }

    let wallet;
    try {
        console.log(`Decrypting the wallet`);
        console.log(json, password);
        wallet = await ethers.Wallet.fromEncryptedJson(json, password);
    } catch (error) {
        if (spinner) {
            spinner.stop();
        }
        console.log(chalk.red(error));
        process.exit(2);
    }

    if (spinner) {
        spinner.stop();
    }
    return wallet;
};

/**
 * Read Encrypted Wallet and return the JSON String.
 * @param {string} path 
 * @returns Promise => json string
 * @warning exits on error.
 */
let readWallet = (file) => {
    let path = privatePath(file);

    return new Promise((resolve, _reject) => {
        fs.readFile(path, (error, data) => {

            if (error) {
                console.log(`Error: `, chalk.red(error));
                process.exit(1);
            } else {
                console.log(data);
                resolve(data);
            }
        });
    })
}

/**
 * Deletes the Encrypted JSON file from the directory
 * @param {String} file 
 * @returns TRUE on success
 */
let deleteWallet = (file) => {
    let path = privatePath(file);

    return new Promise((resolve, _reject) => {
        fs.unlink(path, (error) => {
            if (error) {
                console.log(chalk.red(error));
                process.exit(1);
            } else {
                resolve(true);
            }
        });
    })
}


/**
 * Writes the Encrypted JSON file to the directory
 * @param {String} file name
 * @param {ethers.Wallet} file name
 * @returns TRUE on success
 */
let createWallet = async (file, wallet) => {
    let path = privatePath(file);

    fs.writeFileSync(path, wallet);
}

const askCreation = () => {
    const questions = [
        {
            name: "WALLET",
            type: "input",
            message: "What is the name of the Wallet File (without extension)?"
        },
        {
            name: "PRIVATE_KEY",
            type: "password",
            message: "What is the Private Key?"
        },
        {
            name: "PASSPHRASE",
            type: "password",
            message: "What is the passphrase?"
        }
    ];
    return inquirer.prompt(questions);
};

const askConfirm = () => {
    const questions = [
        {
            name: "ANSWER",
            type: "input",
            message: "Are you sure to continue? yes or no: "
        }
    ];
    return inquirer.prompt(questions);
};

const create = async () => {
    // Get Credentials
    const { WALLET, PRIVATE_KEY, PASSPHRASE } = await askCreation();

    // Check that user can use Private Key
    let wallet;
    try {
        wallet = new ethers.Wallet(PRIVATE_KEY);
    } catch (error) {
        console.error(chalk.red(`Incorrect Private Key. Make sure its right`));
        process.exit(-1);
    }

    // Passphrase is not empty
    if (PASSPHRASE.length <= 12) {
        console.error(chalk.red(`Passphrase is Empty or too weak! Should be atleast 12 Characters`));
        process.exit(2);
    }

    console.log(chalk.bold(`The wallet address ${wallet.address} will be stored in the ${WALLET}.json`));
    console.log(`Make sure that wallet address generated from the privatekey is correct.`);

    const { ANSWER } = await askConfirm();

    if (ANSWER !== 'yes' && ANSWER !== 'no') {
        console.error(chalk.redBright(`Only 'yes' or 'no' is accepted`));
        process.exit(2);
    }

    let encryptedWallet = await wallet.encrypt(PASSPHRASE);

    await createWallet(WALLET, encryptedWallet);

    return {address: wallet.address, path: WALLET};
};

const askRead = () => {
    const questions = [
        {
            name: "WALLET",
            type: "input",
            message: "What is the name of the Wallet File (without extension)?"
        },
        {
            name: "PASSPHRASE",
            type: "password",
            message: "What is the passphrase?"
        }
    ];
    return inquirer.prompt(questions);
};

const read = async () => {
    // Get Credentials
    const { WALLET, PASSPHRASE } = await askRead();

    let json = await readWallet(WALLET);
    let spinner = new Spinner(`Decrypting ${WALLET} wallet...`);

    let wallet = await decryptWallet(json, PASSPHRASE, spinner);

    console.log(chalk.blue(`\n\nThe unlocked wallet in ${WALLET} is ${wallet.address}!`));

    return {path: WALLET, passphrase: PASSPHRASE};
};

const askDelete = () => {
    const questions = [
        {
            name: "WALLET",
            type: "input",
            message: "What is the name of the Wallet File (without extension)?"
        }
    ];
    return inquirer.prompt(questions);
};

const del = async () => {
    // Get Credentials
    const { WALLET } = await askDelete();

    await walletUtil.deleteWallet(WALLET);

    console.log(chalk.blue(`\n\nThe ${WALLET} deleted!`));
};

module.exports = {
    create,
    read,
    decryptWallet,
    readWallet
}