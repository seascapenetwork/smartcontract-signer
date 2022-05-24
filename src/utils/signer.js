const { ethers } = require("ethers");

let commands = [
    "signer-add",
    "signer-remove",
    "sign",
    "signer-list"
]

let isSupportedCommand = (command) => {
    return commands.indexOf(command) > -1;
};

//////////////////////////////////////////////////////////////////////////////////////////////
//
// Validation
//
//////////////////////////////////////////////////////////////////////////////////////////////

let types = [
    "UINT",
    "UINT8",
    "UINT256",
    "ADDRESS",
    "BYTES32",
    "DECIMAL_18",
    "DECIMAL_6",
    "ETHER"
];

let validateValue = (param) => {
     if (param.type === 'UINT8' || param.type === 'UINT256' || param.type === 'DECIMAL_18' || param.type === 'DECIMAL_6' || param.type === 'UINT' || param.type === 'BYTES32' || param.type === 'ETHER') {
         let value = parseFloat(param.value);
         if (isNaN(value) || value < 0) {
             return false;
         }
     }

     return !(param.type === 'ADDRESS' && param.value.indexOf("0x") !== 0);
};

let abiEncode = (param) => {
     if (param.type === "UINT8") {
         return ethers.utils.hexZeroPad(ethers.utils.hexlify(param.value), 1);
     } else if (param.type === "UINT256") {
         return ethers.utils.defaultAbiCoder.encode(["uint256"], [param.value]);
     } else if (param.type === "UINT") {
         return ethers.utils.defaultAbiCoder.encode(["uint"], [param.value]);
     } else if (param.type === "ADDRESS") {
         return param.value;
     } else if (param.type === "DECIMAL_18") {
         let wei = ethers.utils.parseEther(ethers.utils.formatEther(param.value.toString()));
         return ethers.utils.defaultAbiCoder.encode(["uint256"], [wei]);
     } else if (param.type === "DECIMAL_6") {
         let wei = ethers.utils.parseUnits(param.value.toString(), 6);
         return ethers.utils.defaultAbiCoder.encode(["uint256"], [wei]);
     } else if (param.type === "BYTES32") {
         return ethers.utils.defaultAbiCoder.encode(["bytes32"], [param.value]);
     } else if (param.type === "ETHER") {
         let wei = ethers.utils.parseUnits(param.value, "ether").toString();
         return ethers.utils.defaultAbiCoder.encode(["uint256"], [wei]);
     }
     return "";
};

/**
  * @description Validates the parameters
  * @param params is the array of params.
  * Each element in the array is an object containing the "type" and "value" parameters.
  * Parameter can not empty.
  * @returns true if succeed, otherwise the error object with error, and message parameters.
 */
let validateParams = (params) => {
     if (!Array.isArray(params)) {
         return {
             error: "NOT_ARRAY",
             message: "Expected array only"
         }
     }
     if (params.length === 0) {
         return {
             error: "EMPTY",
             message: "Parameters can not by empty"
         }
     }

     for (var i in params) {
         let param = params[i];

         if (!param.type) {
             return {
                 error: "MISSING_TYPE",
                 message: `Parameter type of parameter at index '${i}' is missing.`
             };
         }

         if (types.indexOf(param.type) === -1) {
             return {
                 error: "UNRECOGNIZED_PARAM_TYPE",
                 message: `Parameter type '${param.type}' of paramter at index '${i}' is invalid.`
             }
         }

         if (!param.value && param.value !== 0) {
             return {
                 error: "MISSING_VALUE",
                 message: `The value of the parameter at index '${i}' is missing.`
             }
         }

         if (!validateValue(param)) {
              return {
                 error: "UNRECOGNIZED_PARAM_VALUE",
                 message: `The value '${param.value}' of parameter at index '${i}' is not valid according to parameter type '${param.type}'`
             }
         }
     }

     return true;
};

//////////////////////////////////////////////////////////////////////////////////////////////
//
// Signature
//
//////////////////////////////////////////////////////////////////////////////////////////////

let getEncodeMessage = async function (params) {
    let str = "0x";
    for (var param of params) {
        if (param.length === 0) {
            str = abiEncode(param);
        } else {
            str += abiEncode(param).substr(2);
        }
    }

    return str;
};

/**
 * Hashes and generates the message based on the parameters
 */
let getMessage = async function (params) {
    let str = await getEncodeMessage(params);
    return ethers.utils.keccak256(str);
};

let getSignature = async (message, wallet) => {
    let arr = ethers.utils.arrayify(message);

    try {
        return await wallet.signMessage(arr);
    } catch (error) {
        console.error(error);
        console.error(message);
        console.error(`Error during signing the message by wallet '${wallet.address}'`);
        return "";
    }
};

let signDot = (sign) => {
   return  ethers.utils.splitSignature(sign);
};

module.exports.validateParams       = validateParams;
module.exports.getMessage           = getMessage;
module.exports.getSignature         = getSignature;
module.exports.signDot              = signDot;
module.exports.getEncodeMessage     = getEncodeMessage;
module.exports.isSupportedCommand   = isSupportedCommand;
module.exports.SIGNER_ADD           = commands[0];
module.exports.SIGNER_REMOVE        = commands[1];
module.exports.SIGN                 = commands[2];
module.exports.SIGNER_LIST          = commands[3];
