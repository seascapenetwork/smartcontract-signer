let signUtil  = require("eth-sig-util");
let bufferUtil = require('ethereumjs-util');
let userEcRecover = async (sign) => {
    let date = getDate();
    const data = 'today is ' + date.ymd;
    const msgBufferHex = bufferUtil.bufferToHex(Buffer.from(data, 'utf8'));

    return {
        address: signUtil.recoverPersonalSignature({
            data: msgBufferHex,
            sig: sign,
        }),
        date: ''
    };
};

let getDate = () => {
    const today = new Date();

    const day = today.getUTCDate();
    const month = today.getUTCMonth() + 1;
    const year = today.getUTCFullYear();

    // const hour = today.getUTCHours();
    // const minutes = today.getUTCMinutes();

    const zeroPad = (num) => String(num).padStart(2, '0');

    return {
        ymd: year + '/' + zeroPad(month) + '/' + zeroPad(day)
    }
};

module.exports = {
    userEcRecover,
};