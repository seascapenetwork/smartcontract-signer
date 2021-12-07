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

const { ethers } = require("ethers");
const { cat } = require("shelljs");

const signTypes = [
	"nft-brawl-quality",
	"staking-saloon-scape-points",
	"staking-saloon-bonus",
	"scape-forum-quality"
];


//////////////////////////////////////////////////////////////////////////////////////////////
//
// Validation
//
//////////////////////////////////////////////////////////////////////////////////////////////

let types = [
	"UINT8",
	"UINT256",
	"ADDRESS",
	"DECIMAL_18", 
	"DECIMAL_6"
]

let validateValue = (param) => {
	if (param.type === 'UINT8' || param.type === 'UINT256' || param.type === 'DECIMAL_18' || param.type === 'DECIMAL_6') {
		let value = parseFloat(param.value);
		if (isNaN(value) || value <= 0) {
			return false;
		}
	}

	if (param.type === 'ADDRESS' && param.value.indexOf("0x") !== 0) {
		return false;
	}

	return true;
};

let abiEncode = (param) => {
	if (param.type === "UINT8") {
		return ethers.utils.hexZeroPad(ethers.utils.hexlify(param.value), 1);
	} else if (param.type === "UINT256") {
		return ethers.utils.defaultAbiCoder.encode(["uint256"], [param.value]);
	} else if (param.type === "ADDRESS") {
		return param.value;
	} else if (param.type === "DECIMAL_18") {
		let wei = ethers.utils.parseEther(param.value.toString());
		return ethers.utils.defaultAbiCoder.encode(["uint256"], [wei]);
	} else if (param.type === "DECIMAL_6") {
		let wei = ethers.utils.parseUnits(param.value.toString(), 6);
		return ethers.utils.defaultAbiCoder.encode(["uint256"], [wei]);
	}

	return "";
}

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
				message: `Parameter type ${param.type} of paramter at index '${i}' is invalid.`
			}
		}

		if (!param.value) {
			return {
				error: "MISSING_VALUE",
				message: `The value of the parameter at index '${i}' is missing.`
			}
		}

		if (!validateValue(param)) {
 			return {
				error: "UNRECOGNIZED_PARAM_VALUE",
				message: `The value '${param.value}' of parameter at index '${i}' is not valid according to parameter type '${param.value}'`
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


/**
 * Hashes and generates the message based on the parameters
 */
let getMessage = async function (params) {
	let str;
	for (var param of params) {
		if (str.length === 0) {
			str = abiEncode(param);
		} else {
			str += abiEncode(param).substr(2);
		}	
	}
	let data = ethers.utils.keccak256(str);

	return data;
	// let arr = ethers.utils.arrayify(data);

	try {
		return await wallet.sign(arr);
	} catch (e) {
		return "";
	}
};

let getSignature = async (message, wallet) => {
	let arr = ethers.utils.arrayify(data);

	try {
		return await wallet.sign(arr);
	} catch (error) {
		console.error(`Error during signing the message by wallet ${wallet.address}`);
		return "";
	}
}

/**
 * We suppose that all GET parameters are valid and always passed.
 * 
 * GET parameters:
 * 	nftId 			(integer)
 * 	scapePoints		(integer)
 */
let getStakingSaloonScapePointsSignature = async function (params, wallet) {
	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let nftId = parseInt(params.nftId);
	let scapePoints = parseInt(params.scapePoints);

	// ------------------------------------------------------------------
	// merging parameters into one message
	// ------------------------------------------------------------------
	let bytes32 = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [nftId, scapePoints]);
	let data = ethers.utils.keccak256(bytes32);

	let arr = ethers.utils.arrayify(data);

	try {
		return await wallet.sign(arr);
	} catch (e) {
		return "";
	}
};


/**
 * We suppose that all GET parameters are valid and always passed.
 * 
 * GET parameters:
 * 	bonus 			(integer)
 * 	nftId 			(integer)
 */
let getStakingSaloonBonusSignature = async function (params, wallet) {
	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let bonus = parseInt(params.bonus);
	let nftId1 = parseInt(params.nftId1);
	let nftId2 = parseInt(params.nftId2);
	let nftId3 = parseInt(params.nftId3);

	// ------------------------------------------------------------------
	// merging parameters into one message
	// ------------------------------------------------------------------
	let bytes32 = ethers.utils.defaultAbiCoder.encode(
		["uint256", "uint256", "uint256", "uint256"],
		[bonus, nftId1, nftId2, nftId3]);

	let data = ethers.utils.keccak256(bytes32);

	let arr = ethers.utils.arrayify(data);

	try {
		return await wallet.sign(arr);
	} catch (e) {
		return "";
	}
}

let getScapeForumQualitySignature = async function (params, wallet) {
	// ----------------------------------------------------------------
	// incoming parameters
	// ----------------------------------------------------------------
	let nftId1 = parseInt(params.nftId1);
	let nftId2 = parseInt(params.nftId2);
	let nftId3 = parseInt(params.nftId3);
	let nftId4 = parseInt(params.nftId4);
	let nftId5 = parseInt(params.nftId5);
	let quality = parseInt(params.quality);
	let imgId = parseInt(params.imgId);
	let stakedInt = params.stakedInt;        //remember to update accordingly or verification will fail
	let totalStaked = ethers.utils.parseEther(stakedInt.toString());

	// ------------------------------------------------------------------
	// merging parameters into one message
	// ------------------------------------------------------------------
	let bytes32 = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256", "uint256", "uint256", "uint256", "uint256","uint256"], [nftId1, nftId2, nftId3, nftId4, nftId5, totalStaked,imgId]);

	let bytes1 = ethers.utils.hexZeroPad(ethers.utils.hexlify(quality), 1);
	let str = bytes32 + bytes1.substr(2);
	let data = ethers.utils.keccak256(str);

	let arr = ethers.utils.arrayify(data);

	try {
		return await wallet.sign(arr);
	} catch (e) {
		return "";
	}
};


module.exports.isSupportedType = function(signType) {
	return signTypes.indexOf(signType) > -1;
}

/**
 * Returns an error message, if param is invalid.
 * Otherwise returns true.
 * @param {SignType} signType 
 * @param {Object} params 
 */
module.exports.validateParams = validateParams;

module.exports.getMessage = getMessage;

module.exports.getSignature = getSignature;