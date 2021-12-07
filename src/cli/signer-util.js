let commands = [
    "signer-add",
    "signer-remove"
]

let isSupportedCommand = (command) => {
    return commands.indexOf(command) > -1;
};

module.exports.isSupportedCommand = isSupportedCommand;
module.exports.SIGNER_ADD = commands[0];
module.exports.SIGNER_REMOVE = commands[1];