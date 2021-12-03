# Seascape Message Signer
A Nodejs app to verify Smartcontract interactions within the Seascape Ecosystem by Signing the Messages that user has to pass with itself.

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

There are two ways to interact with the *Seascape Message Signer*:

1. HTTP
2. Message Queue through Rabbit MQ.

In order to run through HTTP, you should call the `http-index.js`:



Run the script with two Environment variables.
 ACCOUNT_1 - a privatekey of the transaction signer.
 INFURA_URL - a node endpoint. Free or paid ethereum node endpoint is available at https://infura.io/
 
 Then, run the code:
 
   node index.js
