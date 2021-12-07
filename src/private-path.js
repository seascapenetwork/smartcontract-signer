/**
 * @description This script deals with the `private` folder in the root directory.
 * 
 * `private` folder contains the encrypted files.
 */
const { ethers }    = require('ethers');
const fs            = require('fs');
const chalk         = require('chalk');
const path          = require('path');

const privatePath = (wallet) => {
    let relPath = path.resolve(__dirname, './../private/') + '/';

    if (wallet == undefined || wallet.length === 0) {
        return relPath;
    }

    return (wallet.indexOf(".json") == -1) ? `${relPath}/${wallet}.json` : `${relPath}/${wallet}`;
};

const dirExist = async (networkId) => {
    let networkDir = privatePath(networkId);

    try {
        await fs.promises.access(networkDir);
    } catch (err) {
        return false;
    }

    try {
        let stat = await fs.promises.stat(networkDir);
        let isDir = stat.isDirectory();
        if (!isDir) {
            throw `Network ID is the file, not a directory. Please delete the file and create network folder`;
        }
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

let dirCreate = async (networkId) => {
    let dir = privatePath(networkId);

    let made = await fs.promises.mkdir(dir, {recursive: false});
    if (made !== undefined) {
        throw `Failed to create a directory for network id ${networkId}. Check the permissions of this script`;
    }

    return true;
}

/**
 * @description returns the list of the encrypted wallets in the `private` folder.
 * @returns array
 * @throws an error if couldn't read the private folder
 */
let listEncryptedWallets = async () => {
    let paths;
    try {
        paths = await fs.promises.readdir(privatePath());
    } catch (error) {
        throw {
            code: error.code,
            message: `Failed to read the Private Path.`
        };
    }

    let files = [];
    try {
        for (var path of paths) {
            let fullPath = privatePath() + path;

            try {
                let stat = await fs.promises.stat(fullPath);
                if (!stat.isDirectory()) {
                    files.push(path);
                }
            } catch (err) {
                console.error(err);
                return false;
            }
        }

        return files;
    } catch (error) {
        console.error(error);
        return [];
    }

    return files;
}

/**
 * Returns the relative path to the Encrypted Wallet relative to src/wallet-util
 * @param {String} file path starting from wallet-util.js script 
 * @returns 
 */
module.exports.privatePath = privatePath;

/**
 * Checks whether the directory exists or not.
 * @param {Number} The network id.
 * @returns boolean indicating whether the directory exists or not
 */
module.exports.dirExist = dirExist;

/**
 * Create a new directory in /private for the given blockchain network id.
 * @param {Number} The network id.
 * @returns true if successfuly created.
 * @throws an error if script has no permission to manipulate with file system or directory already exists
 */
module.exports.dirCreate = dirCreate;

module.exports.listEncryptedWallets = listEncryptedWallets;

/**
 * Decrypt the Keystore wallet with the given password. If failed to decrypt, then return undefined.
 * @param {string} json 
 * @param {string} password 
 * @param {clui.Spinner} spinner 
 * @returns ethers.Wallet
 * @warning exits on error.
 */
module.exports.list = async () => {
    spinner.start();

    let wallet;
    try {
        wallet = await ethers.Wallet.fromEncryptedJson(json, password);
    } catch (error) {
        spinner.stop();

        console.log(chalk.red(error));
        process.exit(2);
    }

    spinner.stop();
    return wallet;
};

/**
 * Read Encrypted Wallet and return the JSON String.
 * @param {string} path 
 * @returns Promise => json string
 * @warning exits on error.
 */
module.exports.readWallet = (file) => {
    let path = getWalletPath(file);

    return new Promise((resolve, _reject) => {
        fs.readFile(path, (error, data) => {
            if (error) {
                console.log(chalk.red(error));
                process.exit(1);
            } else {
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
module.exports.deleteWallet = (file) => {
    let path = getWalletPath(file);

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
 module.exports.createWallet = async (file, wallet) => {
    let path = getWalletPath(file);

    fs.writeFileSync(path, wallet);
}