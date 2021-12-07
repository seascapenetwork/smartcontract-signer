#!/usr/bin/env node

/**
 * The signer runs the Message queries to listen for Messages from other services and returns the signed message with 
 * Private keys.
 * 
 * It runs the RPC server
 */
const chalk 		      = require("chalk");
const { isSupportedCommand, SIGNER_ADD, SIGNER_REMOVE, SIGNER_LIST, SIGN } = require('./cli/signer-util');
const walletUtil = require('./cli/wallet-util');
let mq = require('./mq');

// List of the decrypted wallets.
let conChannel;

// List of the decrypted wallets
// its the object containing the web3.Wallet in the wallet parameter.
// and path containing the wallet file name in the private folder.
let wallets = [];

let walletExists = (walletPath) => {
	for (var wallet of wallets ) {
		if (wallet.path == walletPath) {
			return true;
		}
	}

	return false;
}

let indexOf = (walletPath) => {
	for (var i in wallets ) {
		if (wallets[i].path == walletPath) {
			return i;
		}
	}

	return -1;
}

let walletExistsByAddress = (address) => {
	for (var acc of wallets ) {
		if (acc.wallet.address.toLowerCase() == address.toLowerCase()) {
			return true;
		}
	}

	return false;
}

let indexOfByAddress = (address) => {
	for (var i in wallets ) {
		if (wallets[i].wallet.address.toLowerCase() == address.toLowerCase()) {
			return i;
		}
	}

	return -1;
}


/**
 * @description This has to have boolean type return always.
 * @param {Object} content 
 * @returns bool
 */
let onMsg = async (content, replyTo, correlationId) => {
	console.log(`Received the message to the signer`);

	if (!replyTo || !correlationId) {
		console.error(chalk.redBright(`No replyTo or correlationId. Signer is RPC server so requires those parameters`));
		return false;
	}
	if (!content.command || !isSupportedCommand(content.command)) {
		console.error(chalk.redBright(`Unsupported command ${content.command}`));
		return false;
	}


	let rpcQueueType = mq.QUEUE_TYPE.RPC;
	rpcQueueType.queue = replyTo;

	if (content.command === SIGNER_ADD) {
		if (!content.passphrase) {
			console.log(`Password of the encrypted file is missing.`);
			return false;
		}

		if (!content.path) {
			console.log(`Path was not included`);
			return false;
		}

		if (walletExists(content.path)) {
			let error = "ALREADY_EXISTS";
			let message = `Wallet for path ${content.path} already exists`;
			
			await mq.sendToQueue(conChannel.channel, rpcQueueType, {path: content.path, address: "", error, message}, {correlationId: correlationId});
			return false;
		}

		let json = await walletUtil.readWallet(content.path);
		let wallet = await walletUtil.decryptWallet(json, content.passphrase);

		wallets.push({
			path: content.path,
			wallet: wallet
		});

		await mq.sendToQueue(conChannel.channel, rpcQueueType, {path: content.path, address: wallet.address}, {correlationId: correlationId});
		return true;
	} else if (content.command === SIGNER_REMOVE) {
		if (!content.address && !content.path) {
			console.log(`Missing path or address.`);
			return false;
		}

		let walletIndex = -1;

		if (content.address && !walletExistsByAddress(content.address)) {
			let error = "NO_EXIST";
			let message = `Address ${content.path} wasn't loaded`;
			
			await mq.sendToQueue(conChannel.channel, rpcQueueType, {path: content.path, address: "", error, message}, {correlationId: correlationId});
			return false;
		} else if (content.path && !walletExists(content.path)) {
			let error = "NO_EXIST";
			let message = `Wallet for path ${content.path} wasn't loaded`;
			
			await mq.sendToQueue(conChannel.channel, rpcQueueType, {path: content.path, address: "", error, message}, {correlationId: correlationId});
			return false;
		}

		if (content.address) {
			walletIndex = indexOfByAddress(content.address);
		} else if (content.path) {
			walletIndex = indexOf(content.path);
		}

		if (walletIndex === -1) {
			let error = "NO_EXIST";
			let message = `Wallet index couldn't be detected`;
			
			await mq.sendToQueue(conChannel.channel, rpcQueueType, {path: content.path, address: "", error, message}, {correlationId: correlationId});
			return false;
		} else {
			wallets.splice(walletIndex, 1);
		}

		await mq.sendToQueue(conChannel.channel, rpcQueueType, {path: content.path, address: content.address}, {correlationId: correlationId});
	
		return true;
	} else if (content.command === SIGN) {

	} else if (content.command === SIGNER_LIST) {
		console.log(`Listing the loaded wallets`);
		let list = [];
		for (var acc of wallets) {
			list.push({
				path: acc.path,
				address: acc.wallet.address
			});
		}

		console.log(list);
		await mq.sendToQueue(conChannel.channel, rpcQueueType, list, {correlationId: correlationId});

		return true;
	}

	return false;
};

(async () => {
	try {
		conChannel = await mq.connect();
	} catch (error) {
		process.exit();
	}

	process.on('beforeExit', () => {
		console.log(chalk.bold(`Signer is closing`));
	})

	try {
		await mq.attachToQueue(conChannel.channel, mq.QUEUE_TYPE.SIGNER);
		await mq.listenQueue(conChannel.channel, mq.QUEUE_TYPE.SIGNER, onMsg);
	} catch(error) {
		console.error(chalk.red(error));
		process.exit(1);
	}

	console.log(chalk.blueBright(`Signer started`));
 })();
