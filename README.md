The **Smartcontract Signer** is the application that
signs messages for Ethereum compatible blockchains.

The signed message will generate a signature of the data, that could be verified in smartcontracts using <ins>[`ecrecover`](https://docs.soliditylang.org/en/v0.8.11/units-and-global-variables.html?highlight=ecrecover)</ins> function.

> #### The Unique feature of Smartcontract Signer!
> This application keeps privatekeys as the encrypted files.
> While hiding the privatekeys, the application
> exposes only one port to interact with outer world.

Thus, it's recommended to set up **Smartcontract Signer** in an isolated server that has no access to the internet. 

While application is not connected to the rest of the world, its recommended to connect to the local network, where **Smartcontract Signer** exposes only one port. 

This way, other applications that interact with the clients
could send a data to sign to the **Smartcontract Signer** through the open port.


# Production usage
You don't have to clone the source code in order to use it in production environment. 

The built docker images of **Smartcontract Signer** and **RabbitMQ** are enough to run this application.

This repository comes with [prod](https://github.com/blocklords/smartcontract-signer/tree/prod) branch. This branch contains `docker-compose.yml` in the docker-prod folder with the links to **Smartcontract Signer** and **RabbitMQ** images. You can use it for the production.


So, here are the instructions on how to use it.

1. Clone and checkout the *prod* branch in your computer.
2. In the root directory, create `.env` file based on `.example.env`.
3. In the root directory, create `private` folder where you will keep the encrypted wallet files.
4. Open the terminal, and go to the `smartcontract-signer/docker-prod` folder.
4.1. Here, we first need to run the RabbitMQ by typing the following code:

``` docker-compose up -d mq ```

4.2 Check that state of the `mq` service is *Up*:

``` doker-compose ps ```

If it is up, then run the **Smartcontract Signer**:

``` 
docker-compose up -d signer
docker-compose ps 
```

If both `signer` and `mq` services are running successfully, then we can prepare the services to sign messages.

5. Once the containers are running, we need to run the `Server`
which opens the HTTP channel to receive the data to sign. Also, we need to run `Signer` that will generate a signature with the private keys for the message received from the *Server*. To do it, enter into the `signer` container:

```docker exec -it signer bash```

5.1 Inside the container run the following:
```node src/cli.js server-start```
This will start a server. 

5.2 Then to start a signer, we need to run the following command:
```node src/cli.js signer-start```
This will start a signer.

6. In order to able the Signer, we first need to add encrypted wallet by running

```node src/cli.js wallet-create```

7. Then we need to load encrypted wallet into the Signer

```node src/cli.js signer-add```

8. Finally open the browser, and send the POST parameter to the Signer.

with the following JSON body:

```
{
    "address": "0xC6EF8A96F20d50E347eD9a1C84142D02b1EFedc0",
    "params": [
        {
            "type": "UINT256",
            "value": 3
        }
    ]
}
```

The `address` is the wallet address that will sign the message.
The params is the array of data to sign. The parameters will be concatenated in the given order.

The **Smartcontract Signer** supports the following parameter types are:

* UINT8
* UINT256
* ADDRESS
* DECIMAL_18 
* DECIMAL_6

# Usage
Cli is the main gateway of the applicaion.

- ```src/gateway.js``` - enables the RabbitMQ gateway and the Server. it will be the application that creates child processes.

Cli commands:
- ```cli.js gate-kill``` shuts down both server and encrypted parameters.
- ```cli.js server-start``` enables to receive messages from outside to sign by privatekeys. It is running as the detached child process.
- ```cli.js server-stop``` stops the server, preventing to sign messages. Sends the Message to the server to shut it down.
- ```cli.js signer-start``` imports the encrypted wallets from /private folder, and enables them to the server. It is running as the detached child process.
- ```cli.js signer-stop``` prevents from signing any message.
- ```cli.js signer-add``` decrypted wallet is added to the signer.
- ```cli.js signer-remove``` erases from signer's list in the signer.
- ```cli.js wallet-list``` shows list of loaded encrypted wallets. 
`--all` argument lists all wallet names in the /private folder. 
`--unload` shows the list of wallets that are not loaded.
- ```cli.js wallet-create``` adds the encrypted wallet into the /private folder.
- ```cli.js wallet-delete``` removes the encrypted wallet from the /private directory.
