"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendBorsh = void 0;
const web3_js_1 = require("@solana/web3.js");
const borsh_1 = require("borsh");
const extendBorsh = () => {
    borsh_1.BinaryReader.prototype.readPubkey = function () {
        const reader = this;
        const array = reader.readFixedArray(32);
        return new web3_js_1.PublicKey(array);
    };
    borsh_1.BinaryWriter.prototype.writePubkey = function (value) {
        const writer = this;
        writer.writeFixedArray(value.toBuffer());
    };
};
exports.extendBorsh = extendBorsh;
(0, exports.extendBorsh)();
//# sourceMappingURL=borsh.js.map