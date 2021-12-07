var amqp              = require('amqplib');

let mqUrl = `amqp://${process.env.MQ_HOST || 'mq'}`;

let QUEUE_TYPE = {
    GATEWAY: {
        queue: 'gateway_queue',
        exclusive: false
    },
    SIGNER: {
        queue: 'signer_queue',
        exclusive: false
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
    await channel.assertQueue(queueType.queue, {
        durable: true,
        exclusive: queueType.exclusive
    });
    
    await channel.prefetch(1);
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
    
        let res = await onMsg(content);
        if (res === false) {
            channel.reject(msg, false);
        } else if (res === true) {
            channel.ack(msg);
        } else {
            throw `Invalid response from onMsg callback for queue ${queueType.queue}. Expected either true or false`;
        }
    }, {
        // manual acknowledgment mode,
        // see ../confirms.html for details
        noAck: false
    });
};

let sendToQueue = async (channel, queueType, obj) => {
    let str = JSON.stringify(obj);
    return channel.sendToQueue(queueType.queue, Buffer.from(str));
};

let sendOverMq = async (queueType, data) => {
    let conChannel;
    try {
        conChannel = await connect();
    } catch (error) {
        return console.error(chalk.red(`Internal error. Could not connect to the Message Queue`));
    }

    try {
        await attachToQueue(conChannel.channel, queueType);
    } catch (error) {
        return console.error(chalk.red(`Internal error. Could not register or create ${mq.QUEUE_TYPE.GATEWAY.queue} queue`));
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

module.exports = {
    QUEUE_TYPE,
    connect,
    disconnect,
    attachToQueue,
    listenQueue,
    sendToQueue,
    sendOverMq
}