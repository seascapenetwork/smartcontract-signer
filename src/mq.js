var amqp              = require('amqplib');

let mqUrl = `amqp://${process.env.MQ_HOST || 'mq'}`;

let QUEUE_TYPE = {
    GATEWAY: {
        queue: 'gateway_queue',
        exclusive: false,
        durable: true,
        noack: false,
        autoDelete: true
    },
    SIGNER: {
        queue: 'signer_queue',
        exclusive: false,
        durable: true,
        noack: false,
        autoDelete: true
    },
    RPC: {
        queue: 'amq.rabbitmq.reply-to',
        exclusive: true,
        durable: false,
        noack: true,
        autoDelete: true
    }
}

/**
 * @description Connecting to the Message Queue server...
 * @returns connection, and channel
 * @throws error if message queue can't be connected.
 */
let connect = async () => {
    let connection  = await amqp.connect(mqUrl);

    let channel 
    try {
        channel = await connection.createChannel();
    } catch (error) {
        await connection.close();
        throw error;
    }
    
    return {connection, channel};
};

/**
 * @description Register channel to the queue, if queue doesn't exist, it will be created.
 * @param {amqplib.Channel} channel on which queue is listened 
 * @param {QUEUE_TYPE} queue to register to channel
 * @param {boolean} exclusive only one queue consumer?
 */
let attachToQueue = async (channel, queueType) => { 
    let res = await channel.assertQueue(queueType.queue, {
        durable: queueType.durable,
        exclusive: queueType.exclusive,
        autoDelete: queueType.autoDelete
    });
    
    await channel.prefetch(1);

    if (queueType.exclusive) {
        return res;
    }
}

let disconnect = async(connection, channel) => {
    await channel.close();
    await connection.close();
}

/**
 * @description 
 * @param {amqplib.Channel} channel 
 * @param {QUEUE_TYPE} queue 
 * @param {callback} onMsg 
 * @returns nothing
 */
let listenQueue = async (channel, queueType, onMsg) => {
    return channel.consume(queueType.queue, async (msg) => {
        let content;
        try {
            let str = msg.content.toString();
            content = JSON.parse(str);
        } catch (error3) {
            return channel.reject(msg, false);
        }
    
        let res = await onMsg(content, msg.properties.replyTo, msg.properties.correlationId);
        if (res === false) {
            if (!queueType.noack) {
                channel.reject(msg, false);
            }
        } else if (res === true) {
            if (!queueType.noack) {
                channel.ack(msg);
            }
        } else {
            throw `Invalid response from onMsg callback for queue ${queueType.queue}. Expected either true or false`;
        }
    }, {
        // manual acknowledgment mode,
        // see ../confirms.html for details
        noAck: queueType.noack
    });
};

let sendToQueue = async (channel, queueType, obj, options) => {
    let str = JSON.stringify(obj);
    return channel.sendToQueue(queueType.queue, Buffer.from(str), options);
};

let sendOverMq = async (queueType, data, options) => {
    let conChannel;
    try {
        conChannel = await connect();
    } catch (error) {
        return console.error(chalk.red(`Internal error. Could not connect to the Message Queue`));
    }

    try {
        await attachToQueue(conChannel.channel, queueType);
    } catch (error) {
        return console.error(chalk.red(`Internal error. Could not register or create ${queueType.queue} queue`));
    }

    try {
        await sendToQueue(conChannel.channel, queueType, data);
    } catch (error) {
        return console.error(chalk.redBright(`Failed to send the data over Message Queue for ${queueType.queue}`));
    }

    try {
    await disconnect(conChannel.connection, conChannel.channel);
    } catch (error) {
        return console.error(chalk.redBright(`Failed to disconnect from Message Queue. Please do it manually`));
    }

    return true;
};


let sendOverRpc = async (queueType, data, callback) => {
    let conChannel;
    try {
        conChannel = await connect();
    } catch (error) {
        return console.error(chalk.red(`Internal error. Could not connect to the Message Queue`));
    }

    let attachment;
    try {
        attachment = await attachToQueue(conChannel.channel, QUEUE_TYPE.RPC);
    } catch (error) {
        return console.error(chalk.red(`Internal error. Could not register or create ${queueType.queue} queue`));
    }

    var correlationId = generateUuid();

    let rpcQueueType = QUEUE_TYPE.RPC;
    rpcQueueType.queue = attachment.queue;

    await listenQueue(conChannel.channel, rpcQueueType, async (content, _replyTo, _correlationId) => {

        if (_correlationId != correlationId) {
            return false;
        }

        try {
            await disconnect(conChannel.connection, conChannel.channel);
        } catch (error) {
            console.error(chalk.redBright(`Failed to disconnect from Message Queue. Please do it manually`));
            return false;
        }

        callback(content);

        return true;
    });

    try {
        await sendToQueue(conChannel.channel, queueType, data, {replyTo: rpcQueueType.queue, correlationId: correlationId});
    } catch (error) {
        return console.error(chalk.redBright(`Failed to send the data over RPC Message Queue for ${queueType.queue}`));
    }

    return true;
};

function generateUuid() {
    return Math.random().toString() +
           Math.random().toString() +
           Math.random().toString();
}

module.exports = {
    QUEUE_TYPE,
    connect,
    disconnect,
    attachToQueue,
    listenQueue,
    sendToQueue,
    sendOverMq,
    sendOverRpc
}