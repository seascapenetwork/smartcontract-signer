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
    let relPath = path.resolve(__dirname, './../private/');
    console.log(relPath);
    console.log(`dir name `, __dirname);

    if (wallet == undefined || wallet.length === 0) {
        return relPath;
    }

    return (wallet.indexOf(".json") == -1) ? `${relPath}/${wallet}.json` : `${relPath}/${wallet}`;
};

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
module.exports.listEncryptedWallets = listEncryptedWallets;
