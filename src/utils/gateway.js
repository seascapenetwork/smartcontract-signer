let commands = [
    "server-start",
    "server-stop",
    "signer-start",
    "signer-stop",
    "kill"
]

let isSupportedCommand = (command) => {
    return commands.indexOf(command) > -1;
};

module.exports.isSupportedCommand = isSupportedCommand;
module.exports.SERVER_START = commands[0];
module.exports.SERVER_STOP = commands[1];
module.exports.SIGNER_START = commands[2];
module.exports.SIGNER_STOP = commands[3];
module.exports.KILL = commands[4];