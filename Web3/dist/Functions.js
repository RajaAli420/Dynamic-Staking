"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getPlatformData = exports.initPlatform = exports.Owner = void 0;
const Main_1 = require("./Main");
const web3_js_1 = require("@solana/web3.js");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const buffer_layout_1 = require("@solana/buffer-layout");
const Schema_1 = require("./Schema");
const borsh = __importStar(require("borsh"));
function Owner() {
    const secretkeyString = 
    //   "[232,142,24,24,92,153,114,42,40,155,215,58,39,157,75,253,73,79,216,140,94,56,237,24,58,121,89,42,96,195,143,116,176,68,138,210,49,49,1,145,31,172,242,120,134,134,185,236,61,101,48,76,220,244,24,112,158,203,63,80,171,11,104,180]"
    "[108,25,85,145,124,237,134,39,2,125,15,162,68,252,100,203,75,35,24,238,11,36,136,210,125,74,152,211,116,62,220,33,165,215,139,222,106,251,255,189,23,213,30,19,183,23,209,63,210,19,210,102,216,238,197,30,0,12,78,44,65,28,140,66]";
    const secretKey = Uint8Array.from(JSON.parse(secretkeyString));
    return web3_js_1.Keypair.fromSecretKey(secretKey);
}
exports.Owner = Owner;
const initPlatformData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction'), (0, buffer_layout_utils_1.publicKey)('owner'), (0, buffer_layout_utils_1.u64)('locking_time'), (0, buffer_layout_1.u16)('apr')]);
function initPlatform() {
    return __awaiter(this, void 0, void 0, function* () {
        let owner = Owner();
        let stakingPlatform = web3_js_1.Keypair.generate();
        console.log(stakingPlatform.publicKey.toBase58());
        let stakingPlatformAcc = yield (0, Schema_1.createPlatformAccount)(stakingPlatform, owner);
        let keys = [{
                pubkey: owner.publicKey,
                isSigner: true,
                isWritable: true
            }, {
                pubkey: stakingPlatform.publicKey,
                isSigner: true,
                isWritable: true
            }];
        let data = Buffer.alloc(initPlatformData.span);
        initPlatformData.encode({
            instruction: 4,
            owner: owner.publicKey,
            locking_time: BigInt(123213123),
            apr: 3000,
        }, data);
        let tx = new web3_js_1.Transaction().add(stakingPlatformAcc, new web3_js_1.TransactionInstruction({ keys, data, programId: Main_1.programId }));
        let hash = yield (0, web3_js_1.sendAndConfirmTransaction)(Main_1.connection, tx, [owner, stakingPlatform]);
        console.log(hash);
    });
}
exports.initPlatform = initPlatform;
function getPlatformData() {
    return __awaiter(this, void 0, void 0, function* () {
        let data = yield Main_1.connection.getAccountInfo(new web3_js_1.PublicKey('BkUoEEFPeBTAxWTtNtjsn3Yp2H3PkMKSrgunHd4D5HZv'));
        let info = borsh.deserialize(Schema_1.StakingSchema, Schema_1.StakingInfo, data.data);
        console.log(info);
    });
}
exports.getPlatformData = getPlatformData;
//# sourceMappingURL=Functions.js.map