The **Smartcontract Signer** is the application that
signs messages for Ethereum compatible blockchains.

The signed message will generate a signature of the data, that could be verified in smartcontracts using <ins>[`ecrecover`](https://docs.soliditylang.org/en/v0.8.11/units-and-global-variables.html?highlight=ecrecover)</ins> function.

> #### The Unique feature of Smartcontract Signer!
> This application keeps privatekeys as the encrypted files.
> While hiding what are the privatekeys, the application
> exposes only one port to interact with outer world.

Thus, it's recommended to set up **Smartcontract Signer** in an isolated server that has no access to the rest of the internet. 

While application is not connected to the rest of the world, its recommended to connect to to the local network, where **Smartcontract Signer** exposes only one port. 

This way, other applications that interact with the clients
could send a data to sign to the **Smartcontract Signer** through the open port.


# Production usage



# Installation for Development

## Prerequirements
 Requires:
 
 1. [Docker](https://docker.com/)
 2. [Git](https://git-scm.com/downloads)

## Installation

* Clone the this [repository](https://github.com/blocklords/Message) into your machine.
* Open the directory of the repository, then create an `.env` file based on `.example.env`.
    1. Set the **PORT** to the PORT value where you would want to run it. 
* Visit the directory from your terminal and run the following code:
```docker-compose up -d```

Ready.

# Running

Run the code:
 
```node index.js```

This will prompt the password for each account it finds.

# How to sign
On that endpoint it receives the following information:
  
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

# Usage
Cli is the main gateway of the applicaion.

- ```index.js``` - enables the RabbitMQ gateway. it will be the application that creates child processes.

Cli commands:
- ```cli.js gate-kill``` shuts down both server and encrypted parameters.
- ```cli.js server-start``` enables to receive messages from outside to sign by privatekeys. It is running as the detached child process.
- ```cli.js server-stop``` stops the server, preventing to sign messages. Sends the Message to the server to shut it down.
- ```cli.js signer-start``` imports the encrypted wallets from /private folder, and enables them to the server. It is running as the detached child process.
- ```cli.js signer-stop``` prevents from signing any message.
- ```cli.js signer-add``` decrypted wallet is added to the signer.
- ```cli.js signer-remove``` erases from signer's list in the signer.
- ```cli.js wallet-list``` shows list of loaded encrypted wallets. `--all` argument lists all wallet names in the /private folder. --unloaded shows the list of wallets that are not loaded.
- ```cli.js wallet-create``` adds the encrypted wallet into the /private folder.
- ```cli.js wallet-delete``` removes the encrypted wallet from the /private directory.
