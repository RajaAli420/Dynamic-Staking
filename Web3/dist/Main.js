"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = exports.programId = void 0;
const web3_js_1 = require("@solana/web3.js");
const Schema_1 = require("./Schema");
exports.programId = new web3_js_1.PublicKey("D5EAiEZGuAvJL8woxDNjyW2VDuR89FXEXg37deAJVohi");
exports.connection = new web3_js_1.Connection("https://api.devnet.solana.com");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, Schema_1.createPlatformAccount)("", "");
    });
}
main();
//# sourceMappingURL=Main.js.map