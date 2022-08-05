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
const Functions_1 = require("./Functions");
exports.programId = new web3_js_1.PublicKey("6JR9Z5krBSdP2PD9fwFN9W3xLzsDa5StcNu338g9ygBX");
exports.connection = new web3_js_1.Connection("https://api.devnet.solana.com");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // await initPlatform()
        // await addTokenToPool()
        yield (0, Functions_1.stake)();
        // await unstake()
        // await withdrawFromPoolAdmin()
        // await claimrReward()
        // await getPlatformData()
        // await getStakerData('6cFU9keNVZGYNtFBLkE4MdD5VpNsjw94Y756ooidEcPk')
        //     let stakepda = await PublicKey.findProgramAddress([Buffer.from('DynamicAPR')], programId)
        // let poolPda = await PublicKey.findProgramAddress([Buffer.from('DynamicAPRPool')], programId)
        // console.log("STAKE PDA: ",stakepda[0].toBase58(),'\n',"POOL PDA :",poolPda[0].toBase58())
    });
}
main();
//# sourceMappingURL=Main.js.map