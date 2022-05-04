/**
 * 	@description It opens the POST endpoint.
 *
 * 	On that endpoint it receives the following information:
 */
const chalk 		= require('chalk');
const { SIGN, validateParams, getMessage, signDot, getEncodeMessage } = require('./utils/signer');
const { sendOverRpc, QUEUE_TYPE } = require('./mq');

// or server to listen to sign up
const express = require('express');
const app = express();
app.use(express.json()); // built-in middleware for express
const port = process.env.SERVER_PORT || 3000;
const web3 = require('./utils/web3');

/**
 * @description Signs the incoming from outword messages to be signed by the 
 * signer.js
 * 
 * parameters it accepts:
 * req.address - the wallet address that should sign the message
 * req.params - the list of parameters to sign to
 * 
 * The req.params is the array of the objects. Objects contain "type" and "value" parameters.
 * 
 * Type could be UINT8, UINT256, INT8, INT256, ADDRESS.
 */
app.post('/sign-message', async (req, res) => {
	if (!req.body.address || req.body.address.length === 0) {
		return res.status(404).send({signature: "", error: "EMPTY", message: "No parameters were received"});
	}

	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let validation = validateParams(req.body.params);
	if (validation !== true) {
		validation.signature = "";
		return res.status(404).send(validation);
	}

	let message;
	try {
		message = await getMessage(req.body.params);
	} catch (error) {
		console.error(error);
		return res.status(500).send({
			signature: "",
			error: "INVALID_MESSAGE",
			message: "Could not generate the message to sign based on the parameters"
		});
	}

	let overRpcParams = {command: SIGN, address: req.body.address, message: message};
	
    let resMq = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, (content) => {
    	if (content.error) {
        	console.error(chalk.redBright(content.message));
			return res.status(503).send({
				signature: "",
				error: content.error,
				message: content.message
			})
		} else {
            console.log(chalk.green(`Server received the signature from the Signer!`));
			return res.send({
				signature: content.signature
			});
        }
    });

    if (resMq !== true) {
        console.error(chalk.redBright(resMq));
		return res.status(503).send({
			signature: "",
			error: "NOT_ABLE_SIGN",
			message: resMq.toString()
		});
    }
});

/**
 * url /sign-quality?quality=3&owner=0x9ceAB9b5530762DE5409F2715e85663405129e54&amountWei=9&mintedTime=1647576340&nonce=5&address=0x65456fe4b7C4D32CfeEC9A585902F5f89db19E4c
 */
app.get('/sign-quality', async function (req, res) {
	let privateAddress = req.query.address;
	let quality = parseInt(req.query.quality);
	let owner = req.query.owner;
	let amount = req.query.amountWei;
	let mintedTime = parseInt(req.query.mintedTime.toString());
	let nonce = parseInt(req.query.nonce.toString());

	let param = {
		address: privateAddress,
		params: [
			{
				type: 'ADDRESS',
				value: owner
			},
			{
				type: 'DECIMAL_18',
				value: amount
			},
			{
				type: 'UINT256',
				value: mintedTime
			},
			{
				type: 'UINT8',
				value: quality
			},
			{
				type: 'UINT256',
				value: nonce
			},
		]
	};


	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let validation = validateParams(param.params);
	if (validation !== true) {
		validation.signature = "";
		return res.status(404).send(validation);
	}

	let message;
	try {
		message = await getMessage(param.params);
	} catch (error) {
		console.error(error);
		return res.status(500).send({
			signature: "",
			error: "INVALID_MESSAGE",
			message: "Could not generate the message to sign based on the parameters"
		});
	}

	let overRpcParams = {command: SIGN, address: privateAddress, message: message};

	let resMq = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, content => {
		if (content.error) {
			console.error(chalk.redBright(content.message));
			return res.status(503).send({
				signature: "",
				error: content.error,
				message: content.message
			})
		} else {
			console.log(chalk.green(`Server received the signature from the Signer!`));
			return res.send({
				signature: content.signature
			});
		}
	});

	if (resMq !== true) {
		console.error(chalk.redBright(resMq));
		return res.status(503).send({
			signature: "",
			error: "NOT_ABLE_SIGN",
			message: resMq.toString()
		});
	}
});

/**
 * url sign-nft-scape-points?nftId=3&scapePoints=605&address=0x356B35270eA4cf3Da0FEa1fF743d2b9b908FDf15
 */
app.get('/sign-nft-scape-points', async function (req, res) {
	let privateAddress = req.query.address;
	let nftId = parseInt(req.query.nftId);
	let scapePoints = parseInt(req.query.scapePoints);

	let param = {
		address: privateAddress,
		params: [
			{
				type: 'UINT256',
				value: nftId
			},
			{
				type: 'UINT256',
				value: scapePoints
			},
		]
	};


	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let validation = validateParams(param.params);
	if (validation !== true) {
		validation.signature = "";
		return res.status(404).send(validation);
	}

	let message;
	try {
		message = await getMessage(param.params);
	} catch (error) {
		console.error(error);
		return res.status(500).send({
			signature: "",
			error: "INVALID_MESSAGE",
			message: "Could not generate the message to sign based on the parameters"
		});
	}

	let overRpcParams = {command: SIGN, address: privateAddress, message: message};

	let resMq = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, content => {
		if (content.error) {
			console.error(chalk.redBright(content.message));
			return res.status(503).send({
				signature: "",
				error: content.error,
				message: content.message
			})
		} else {
			console.log(chalk.green(`Server received the signature from the Signer!`));
			return res.send(content.signature);
		}
	});

	if (resMq !== true) {
		console.error(chalk.redBright(resMq));
		return res.status(503).send({
			signature: "",
			error: "NOT_ABLE_SIGN",
			message: resMq.toString()
		});
	}
});

/**
 * url /sign-nft-staking-bonus?bonus=300&nftId1=101&nftId2=202&nftId3=303&address=0x356B35270eA4cf3Da0FEa1fF743d2b9b908FDf15
 */
app.get('/sign-nft-staking-bonus', async function (req, res) {
	let privateAddress = req.query.address;
	let bonus = parseInt(req.query.bonus);
	let nftId1 = parseInt(req.query.nftId1);
	let nftId2 = parseInt(req.query.nftId2);
	let nftId3 = parseInt(req.query.nftId3);

	let param = {
		address: privateAddress,
		params: [
			{
				type: 'UINT256',
				value: bonus
			},
			{
				type: 'UINT256',
				value: nftId1
			},
			{
				type: 'UINT256',
				value: nftId2
			},
			{
				type: 'UINT256',
				value: nftId3
			},
		]
	};


	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let validation = validateParams(param.params);
	if (validation !== true) {
		validation.signature = "";
		return res.status(404).send(validation);
	}

	let message;
	try {
		message = await getMessage(param.params);
	} catch (error) {
		console.error(error);
		return res.status(500).send({
			signature: "",
			error: "INVALID_MESSAGE",
			message: "Could not generate the message to sign based on the parameters"
		});
	}

	let overRpcParams = {command: SIGN, address: privateAddress, message: message};

	let resMq = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, content => {
		if (content.error) {
			console.error(chalk.redBright(content.message));
			return res.status(503).send({
				signature: "",
				error: content.error,
				message: content.message
			})
		} else {
			console.log(chalk.green(`Server received the signature from the Signer!`));
			return res.send(content.signature);
		}
	});

	if (resMq !== true) {
		console.error(chalk.redBright(resMq));
		return res.status(503).send({
			signature: "",
			error: "NOT_ABLE_SIGN",
			message: resMq.toString()
		});
	}
});
app.get('/single-staking-complete', async function (req, res) {
	let privateAddress = req.query.address;
	let sessionId = parseInt(req.query.sessionId);
	let completedNum = parseInt(req.query.completedNum);
	let owner = req.query.owner;

	let param = {
		address: privateAddress,
		params: [
			{
				type: 'UINT256',
				value: sessionId
			},
			{
				type: 'UINT8',
				value: completedNum
			},
			{
				type: 'ADDRESS',
				value: owner
			}

		]
	};

	let validation = validateParams(param.params);
	if (validation !== true) {
		validation.signature = "";
		return res.status(404).send(validation);
	}

	let message;
	try {
		message = await getMessage(param.params);
	} catch (error) {
		console.error(error);
		return res.status(500).send({
			signature: "",
			error: "INVALID_MESSAGE",
			message: "Could not generate the message to sign based on the parameters"
		});
	}

	let overRpcParams = {command: SIGN, address: privateAddress, message: message};

	let resMq = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, content => {
		if (content.error) {
			console.error(chalk.redBright(content.message));
			return res.status(503).send({
				signature: "",
				error: content.error,
				message: content.message
			})
		} else {
			console.log(chalk.green(`Server received the signature from the Signer!`));
			let dot = signDot(content.signature);
			return res.send({
				r: dot.r,
				s: dot.s,
				v: dot.v
			});
		}
	});

	if (resMq !== true) {
		console.error(chalk.redBright(resMq));
		return res.status(503).send({
			signature: "",
			error: "NOT_ABLE_SIGN",
			message: resMq.toString()
		});
	}
});

/**
 * url /staking-user-signed?owner=0x2325Ab5419fb45608EC34C7329ED6882050F67C4&sign=0xf55e3e2f77244e0428660f145cee54f039c64eda9fccd06b15c4da13944cacb47f89b841ac1bc8a81681b654535aacfb9d6bcc20a6ac499e81f4ca2541b022dd1b
 */
app.get('/staking-user-signed', async function (req, res) {
	let sign = req.query.sign;
	let owner = req.query.owner;
	let recover = await web3.userEcRecover(sign);

	return res.json({
		'verify': owner.toLowerCase() === recover.address.toLowerCase()
	})
});

/**
 * url sign-scape-forum-quality?quality=3&imgId=37&stakedInt=15&nftId1=101&nftId2=202&nftId3=303&nftId4=404&&nftId5=505&address=0xb7fA673753c321f14733Eff576bC0d8E644e455e
 */
app.get('/sign-scape-forum-quality', async function (req, res) {
	let privateAddress = req.query.address;
	let nftId1 = parseInt(req.query.nftId1);
	let nftId2 = parseInt(req.query.nftId2);
	let nftId3 = parseInt(req.query.nftId3);
	let nftId4 = parseInt(req.query.nftId4);
	let nftId5 = parseInt(req.query.nftId5);
	let quality = parseInt(req.query.quality);
	let imgId = parseInt(req.query.imgId);
	let stakedInt = req.query.stakedInt;

	let param = {
		address: privateAddress,
		params: [
			{
				type: 'UINT256',
				value: nftId1
			},
			{
				type: 'UINT256',
				value: nftId2
			},
			{
				type: 'UINT256',
				value: nftId3
			},
			{
				type: 'UINT256',
				value: nftId4
			},
			{
				type: 'UINT256',
				value: nftId5
			},
			{
				type: 'ETHER',
				value: stakedInt
			},
			{
				type: 'UINT256',
				value: imgId
			},
			{
				type: 'UINT8',
				value: quality
			},

		]
	};

	let validation = validateParams(param.params);
	if (validation !== true) {
		validation.signature = "";
		return res.status(404).send(validation);
	}

	let message;
	try {
		message = await getMessage(param.params);
	} catch (error) {
		console.error(error);
		return res.status(500).send({
			signature: "",
			error: "INVALID_MESSAGE",
			message: "Could not generate the message to sign based on the parameters"
		});
	}

	let overRpcParams = {command: SIGN, address: privateAddress, message: message};

	let resMq = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, content => {
		if (content.error) {
			console.error(chalk.redBright(content.message));
			return res.status(503).send({
				signature: "",
				error: content.error,
				message: content.message
			})
		} else {
			console.log(chalk.green(`Server received the signature from the Signer!`));
			return res.send({
				signature: content.signature
			});
		}
	});

	if (resMq !== true) {
		console.error(chalk.redBright(resMq));
		return res.status(503).send({
			signature: "",
			error: "NOT_ABLE_SIGN",
			message: resMq.toString()
		});
	}
});

/**
 * url /sign-zombie-farm-nft-token?tokenAddress=0x9ceAB9b5530762DE5409F2715e85663405129e54&nftAddress=0x607cBd90BE76e9602548Fbe63931AbE9E8af8aA7&amount=33&nftId=63&sessionId=9&address=0xC0C326FfeBBE337FE1585B99C41484cBBd321E29
 */
app.get('/sign-zombie-farm-nft-token', async function (req, res) {
	let privateAddress = req.query.address;
	let tokenAddress = req.query.tokenAddress;
	let nftAddress = req.query.nftAddress;
	let amount = req.query.amount;
	let nftId = parseInt(req.query.nftId);
	let sessionId = parseInt(req.query.sessionId);

	let param = {
		address: privateAddress,
		params: [
			{
				type: "ADDRESS",
				value: tokenAddress
			},
			{
				type: 'UINT',
				value: sessionId
			},
			{
				type: 'UINT',
				value: nftId
			},
			{
				type: "ADDRESS",
				value: nftAddress
			},

		]
	};

	if (!privateAddress || privateAddress.length === 0) {
		return res.status(404).send({signature: "", error: "EMPTY", message: "No parameters were received"});
	}

	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let validation = validateParams(param.params);
	if (validation !== true) {
		validation.signature = "";
		return res.status(404).send(validation);
	}

	let message;
	try {
		message = await getMessage(param.params);
	} catch (error) {
		console.error(error);
		return res.status(500).send({
			signature: "",
			error: "INVALID_MESSAGE",
			message: "Could not generate the message to sign based on the parameters"
		});
	}

	let overRpcParams = {command: SIGN, address: privateAddress, message: message};

	let resMq = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, content => {
		if (content.error) {
			console.error(chalk.redBright(content.message));
			return res.status(503).send({
				signature: "",
				error: content.error,
				message: content.message
			})
		} else {
			console.log(chalk.green(`Server received the signature from the Signer!`));

			let dot = signDot(content.signature);

			getEncodeMessage([
				{
					"type": "UINT",
					"value": dot.v
				},
				{
					"type": "BYTES32",
					"value": dot.r
				},
				{
					"type": "BYTES32",
					"value": dot.s
				},
				{
					"type": "UINT",
					"value": nftId
				},
				{
					"type": "ETHER",
					"value": amount
				}
			]).then(encode => {
				return res.send({
					signature: encode
				});
			});
		}
	});

	if (resMq !== true) {
		console.error(chalk.redBright(resMq));
		return res.status(503).send({
			signature: "",
			error: "NOT_ABLE_SIGN",
			message: resMq.toString()
		});
	}
});

/**
 * url /sign-zombie-farm-nft?weight=333&nftId=67&nftAddress=0x607cBd90BE76e9602548Fbe63931AbE9E8af8aA7&nonce=95&address=0xC0C326FfeBBE337FE1585B99C41484cBBd321E29
 */
app.get('/sign-zombie-farm-nft', async (req, res) => {
	let privateAddress = req.query.address;
	let weight = parseInt(req.query.weight);
	let nftId = parseInt(req.query.nftId);
	let nftAddress = req.query.nftAddress;
	let nonce = parseInt(req.query.nonce.toString());

	let param = {
		address: privateAddress,
		params: [
			{
				type: 'UINT',
				value: nftId
			},
			{
				type: 'UINT',
				value: weight
			},
			{
				type: "ADDRESS",
				value: nftAddress
			},
			{
				type: "UINT",
				value: nonce
			},

		]
	};

	if (!privateAddress || privateAddress.length === 0) {
		return res.status(404).send({signature: "", error: "EMPTY", message: "No parameters were received"});
	}

	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let validation = validateParams(param.params);
	if (validation !== true) {
		validation.signature = "";
		return res.status(404).send(validation);
	}

	let message;
	try {
		message = await getMessage(param.params);
	} catch (error) {
		console.error(error);
		return res.status(500).send({
			signature: "",
			error: "INVALID_MESSAGE",
			message: "Could not generate the message to sign based on the parameters"
		});
	}

	let overRpcParams = {command: SIGN, address: req.body.address, message: message};

	let resMq = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, content => {
		if (content.error) {
			console.error(chalk.redBright(content.message));
			return res.status(503).send({
				signature: "",
				error: content.error,
				message: content.message
			})
		} else {
			console.log(chalk.green(`Server received the signature from the Signer!`));

			let dot = signDot(content.signature);

			getEncodeMessage([
				{
					"type": "UINT",
					"value": dot.v
				},
				{
					"type": "BYTES32",
					"value": dot.r
				},
				{
					"type": "BYTES32",
					"value": dot.s
				},
				{
					"type": "UINT",
					"value": nftId
				},
				{
					"type": "UINT",
					"value": weight
				}
			]).then(encode => {
				return res.send({
					signature: encode
				});
			});
		}
	});

	if (resMq !== true) {
		console.error(chalk.redBright(resMq));
		return res.status(503).send({
			signature: "",
			error: "NOT_ABLE_SIGN",
			message: resMq.toString()
		});
	}
});

/**
 * url /single-zombie?sessionId=61&levelId=3&slotId=2&challenge=0xEe44A961178f4A50f68576d39A69e5F9615Da1f3&owner=0x607cBd90BE76e9602548Fbe63931AbE9E8af8aA7
 */
app.get('/single-zombie', async function (req, res) {
	let privateAddress = req.query.address;
	let sessionId = parseInt(req.query.sessionId);
	let levelId = parseInt(req.query.levelId);
	let slotId = parseInt(req.query.slotId);
	let challenge = req.query.challenge;
	let owner = req.query.owner;

	let param = {
		address: privateAddress,
		params: [
			{
				type: 'UINT256',
				value: sessionId
			},
			{
				type: 'UINT8',
				value: levelId
			},
			{
				type: 'UINT8',
				value: slotId
			},
			{
				type: 'ADDRESS',
				value: challenge
			},
			{
				type: 'ADDRESS',
				value: owner
			}

		]
	};

	let validation = validateParams(param.params);
	if (validation !== true) {
		validation.signature = "";
		return res.status(404).send(validation);
	}

	let message;
	try {
		message = await getMessage(param.params);
	} catch (error) {
		console.error(error);
		return res.status(500).send({
			signature: "",
			error: "INVALID_MESSAGE",
			message: "Could not generate the message to sign based on the parameters"
		});
	}

	let overRpcParams = {command: SIGN, address: privateAddress, message: message};

	let resMq = await sendOverRpc(QUEUE_TYPE.SIGNER, overRpcParams, content => {
		if (content.error) {
			console.error(chalk.redBright(content.message));
			return res.status(503).send({
				signature: "",
				error: content.error,
				message: content.message
			})
		} else {
			console.log(chalk.green(`Server received the signature from the Signer!`));
			let dot = signDot(content.signature);
			return res.send({
				r: dot.r,
				s: dot.s,
				v: dot.v
			});
		}
	});

	if (resMq !== true) {
		console.error(chalk.redBright(resMq));
		return res.status(503).send({
			signature: "",
			error: "NOT_ABLE_SIGN",
			message: resMq.toString()
		});
	}
});

app.listen(port, async () => {
	console.log(chalk.blueBright(chalk.bold(`> Server`) + ` runs on https://localhost:${port}!`));
});