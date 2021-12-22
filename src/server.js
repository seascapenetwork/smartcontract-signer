/**
 * 	@description It opens the POST endpoint.
 * 
 * 	On that endpoint it receives the following information:
 */

const chalk 		= require('chalk');
const { SIGN, validateParams, getMessage } = require('./utils/signer');
const { sendOverRpc, QUEUE_TYPE } = require('./mq');

// or server to listen to sign up
const express = require('express');
const app = express()
const port = 3000;

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
	if (!validation) {
		validation.signature = "";
		res.status(404).send(validation);
	}

	let message;
	try {
		message = await getMessage(req.body.params);
	} catch (error) {
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
            console.log(chalk.green(`Smartcontract Signer add signal was sent to Gateway!`));
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

app.listen(port, async () => {
	console.log(chalk.blueBright(chalk.bold(`> Server`) + ` runs on https://localhost:${port}!`));
});