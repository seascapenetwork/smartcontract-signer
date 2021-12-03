/**
 * 	@description It opens the POST endpoint.
 * 
 * 	On that endpoint it receives the following information:
 * 
 *  signerAddress: the wallet that should sign the message.
 *  params: [
 * 		{
 * 			"type": "UINT8"|"UINT256"|"ADDRESS"|"DECIMAL_18", "DECIMAL_6"
 *  		"value": ""
 * 		}
 *  ]
 * 
 *  Then this signer will sign with the given address, and return the signature.
 *  
 *  HTTP 200 response:
 *  {
 * 		"signature": "",
 *  }
 * 
 *  HTTP 400 response:
 *  {
 * 		"signature": "",
 * 		"error": "UNRECOGNIZED_SIGNER_ADDRESS",
 *  	"message": "The given '0x00.000' is invalid."
 *  }
 * 
 *  The possible errors are:
 *  	UNRECOGNIZED_PARAM_TYPE
 * 		Parameter type `ADRESS` of paramter at index '0' is invalid.
 * 
 * 		MISSING_TYPE
 * 		Parameter type of parameter at index '1' is missing.
 * 		
 * 		INVALID_VALUE
 * 		The value `asd` of parameter at index '2' is not valid according to parameter type `UINT256`
 * 
 * 		MISSING_VALUE
 * 		The value of the parameter at index '0' is missing.
 */

const chalk 		= require("chalk");
const clear         = require("clear");
let defaultConsole  = chalk.keyword('orange');
const figlet        = require("figlet");

const { initWallets } = require('./wallets');
const sign            = require('./sign');

// or server to listen to sign up
const express = require('express');
const app = express()
const port = 3000;

/**
 * @description Print the Greetings to the Seascape Message Signer
 * 
 * This is the entry point of the Seascape Signer.
 */
const init = async () => {
    clear();

    console.log(
      chalk.yellow(
        figlet.textSync("Seascape Message Signer", {
          font: "Standard",
          horizontalLayout: "default",
          verticalLayout: "default"
        })
      )
    );

    console.log(
        defaultConsole(
            "\n\nIt accepts the HTTP request on defined network!"
        )
    );
};

let nftBrawlWallet;
let scapePointsWallet;
let stakingBonusWallet; 
let forumQualityWallet;

/**
 * NFT Brawl: We suppose that all GET parameters are valid and always passed.
 * 
 * GET parameters:
 * 	quality 		(integer)
 * 	owner 			(address)
 * 	amountWei		(integer in wei)
 * 	mintedTime		(integer)
 */
app.get('/sign-quality', async function (req, res) {
	let signature = "";
	let signType = "nft-brawl-quality";

	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let paramError = sign.validateParams(signType, content.params);
    if (paramError) {
        console.error(chalk.red(paramError));
        res.send(signature);
		return;
	}

	// ------------------------------------------------------------------
	// merging parameters into one message
	// ------------------------------------------------------------------

	try {
		// Signature could be signed in other method:
		// https://gist.github.com/belukov/3bf74d8e99fb5b8ad697e881fca31929
		signature = await sign.getSignature(signType, req.query, nftBrawlWallet);
	} catch (e) {
		signature = "";
	}

	console.log("Signature: " + signature);

	res.send(signature);
})

/**
 * We suppose that all GET parameters are valid and always passed.
 * 
 * GET parameters:
 * 	nftId 			(integer)
 * 	scapePoints		(integer)
 */
app.get('/sign-nft-scape-points', async function (req, res) {
	let signature = "";
	let signType = "staking-saloon-scape-points";

	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let paramError = sign.validateParams(signType, content.params);
    if (paramError) {
        console.error(chalk.red(paramError));
        res.send(signature);
		return;
	}

	// ------------------------------------------------------------------
	// merging parameters into one message
	// ------------------------------------------------------------------

	try {
		// Signature could be signed in other method:
		// https://gist.github.com/belukov/3bf74d8e99fb5b8ad697e881fca31929
		signature = await sign.getSignature(signType, req.query, scapePointsWallet);
	} catch (e) {
		signature = "";
	}

	console.log("Signature: " + signature);

	res.send(signature);
})


/**
 * We suppose that all GET parameters are valid and always passed.
 * 
 * GET parameters:
 * 	bonus 			(integer)
 * 	nftId 			(integer)
 */
app.get('/sign-nft-staking-bonus', async function (req, res) {
	let signature = "";
	let signType = "staking-saloon-bonus";

	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let paramError = sign.validateParams(signType, content.params);
    if (paramError) {
        console.error(chalk.red(paramError));
        res.send(signature);
		return;
	}

	// ------------------------------------------------------------------
	// merging parameters into one message
	// ------------------------------------------------------------------

	try {
		// Signature could be signed in other method:
		// https://gist.github.com/belukov/3bf74d8e99fb5b8ad697e881fca31929
		signature = await sign.getSignature(signType, req.query, stakingBonusWallet);
	} catch (e) {
		signature = "";
	}

	console.log("Signature: " + signature);

	res.send(signature);
})


app.get('/sign-scape-forum-quality', async function (req, res) {
	let signature = "";
	let signType = "scape-forum-quality";

	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let paramError = sign.validateParams(signType, content.params);
    if (paramError) {
        console.error(chalk.red(paramError));
        res.send(signature);
		return;
	}

	// ------------------------------------------------------------------
	// merging parameters into one message
	// ------------------------------------------------------------------

	try {
		// Signature could be signed in other method:
		// https://gist.github.com/belukov/3bf74d8e99fb5b8ad697e881fca31929
		signature = await sign.getSignature(signType, req.query, forumQualityWallet);
	} catch (e) {
		signature = "";
	}

	console.log("Signature: " + signature);

	res.send(signature);
})

app.listen(port, async () => {
	init();

	// import wallets for certain Network IDs.
    // Its in interactive mode, so requires user to type the passphrase to decrypt the wallets.
	let wallets = await initWallets(process.env.NETWORK_ID);
	nftBrawlWallet = wallets.nftBrawlWallet;
	scapePointsWallet = wallets.scapePointsWallet;
	stakingBonusWallet = wallets.stakingBonusWallet;
	forumQualityWallet = wallets.forumQualityWallet;

	console.log(chalk.green(`\n\nSeascape Signer runs on https://localhost:${port}!`));
});