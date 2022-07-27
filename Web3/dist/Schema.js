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
exports.getStaker2 = exports.getStaker = exports.getPayer = exports.createStakeAccount = exports.createPlatformAccount = exports.StakingSchema = exports.Stakers = exports.APRChange = exports.StakingInfo = void 0;
const web3_js_1 = require("@solana/web3.js");
const borsh_1 = require("./borsh");
const borsh = __importStar(require("borsh"));
const Main_1 = require("./Main");
class StakingInfo {
    constructor(fields) {
        this.is_initialized = fields.is_initialized;
        this.owner = fields.owner;
        this.apr = fields.apr;
        this.total_staked = fields.total_staked;
        this.total_stakers = fields.total_stakers;
        this.pool_size = fields.pool_size;
        this.staking_period = fields.staking_period;
        this.emergency_stop = fields.emergency_stop;
        this.claimed_rewards = fields.claimed_rewards;
        this.claimable_rewards = fields.claimable_rewards;
        this.apr_change_arr = fields.apr_change_arr;
    }
}
exports.StakingInfo = StakingInfo;
class APRChange {
    constructor(fields) {
        this.new_apr = fields.new_apr;
        this.time_of_change = fields.time_of_change;
        this.reward_change = fields.reward_change;
    }
}
exports.APRChange = APRChange;
class Stakers {
    constructor(fields) {
        this.is_initialized = fields.is_initialized;
        this.wallet_address = fields.wallet_address;
        this.amount = fields.amount;
        this.time_of_stake = fields.time_of_stake;
        this.staking_time_period = fields.staking_time_period;
    }
}
exports.Stakers = Stakers;
exports.StakingSchema = new Map([
    [StakingInfo,
        {
            kind: 'struct',
            fields: [
                ['is_initialized', 'u8'],
                ['owner', 'pubkey'],
                ['apr', 'u16'],
                ['total_staked', 'u64'],
                ['total_stakers', 'u16'],
                ['pool_size', 'u64'],
                ['staking_period', 'u64'],
                ['emergency_stop', 'u8'],
                ['claimed_rewards', 'u64'],
                ['claimable_rewards', 'u64'],
                ['apr_change_arr', [APRChange]],
            ]
        }
    ],
    [Stakers,
        {
            kind: 'struct',
            fields: [
                ['is_initialized', 'u8'],
                ['wallet_address', 'pubkey'],
                ['amount', 'u64'],
                ['time_of_stake', 'u64'],
                ['staking_time_period', 'u64'],
            ]
        }
    ],
    [APRChange,
        {
            kind: 'struct',
            fields: [
                ['new_apr', 'u16'],
                ['time_of_change', 'u64'],
                ['reward_change', 'u64'],
            ]
        }
    ]
]);
(0, borsh_1.extendBorsh)();
function createPlatformAccount(platformAccount, payerAccount) {
    return __awaiter(this, void 0, void 0, function* () {
        let test = [];
        for (let i = 0; i < 1000; i++) {
            test.push(new APRChange({ new_apr: 0, time_of_change: 0, reward_change: 0 }));
        }
        let platformSize = borsh.serialize(exports.StakingSchema, new StakingInfo({
            is_initialized: false,
            owner: new web3_js_1.PublicKey(0),
            apr: 0,
            total_staked: 0,
            total_stakers: 0,
            pool_size: 0,
            staking_period: 0,
            emergency_stop: false,
            claimed_rewards: 0,
            claimable_rewards: 0,
            apr_change_arr: test
        })).length;
        console.log(platformSize);
        return web3_js_1.SystemProgram.createAccount({
            fromPubkey: payerAccount.publicKey,
            newAccountPubkey: platformAccount.publicKey,
            lamports: yield Main_1.connection.getMinimumBalanceForRentExemption(platformSize),
            space: platformSize,
            programId: Main_1.programId
        });
    });
}
exports.createPlatformAccount = createPlatformAccount;
function createStakeAccount(stakerAccount, payerAccount) {
    return __awaiter(this, void 0, void 0, function* () {
        let tx = new web3_js_1.Transaction();
        let stakeAccountSize = borsh.serialize(exports.StakingSchema, new Stakers({
            is_initialized: false,
            wallet_address: new web3_js_1.PublicKey(0),
            amount: 0,
            time_of_stake: 0,
            staking_time_period: 0
        })).length;
        return tx.add(web3_js_1.SystemProgram.createAccount({
            fromPubkey: payerAccount.publicKey,
            newAccountPubkey: stakerAccount.publicKey,
            lamports: yield Main_1.connection.getMinimumBalanceForRentExemption(stakeAccountSize),
            space: stakeAccountSize,
            programId: Main_1.programId,
        }));
    });
}
exports.createStakeAccount = createStakeAccount;
function getPayer() {
    return __awaiter(this, void 0, void 0, function* () {
        const secretkeyString = 
        //   "[232,142,24,24,92,153,114,42,40,155,215,58,39,157,75,253,73,79,216,140,94,56,237,24,58,121,89,42,96,195,143,116,176,68,138,210,49,49,1,145,31,172,242,120,134,134,185,236,61,101,48,76,220,244,24,112,158,203,63,80,171,11,104,180]"
        "[108,25,85,145,124,237,134,39,2,125,15,162,68,252,100,203,75,35,24,238,11,36,136,210,125,74,152,211,116,62,220,33,165,215,139,222,106,251,255,189,23,213,30,19,183,23,209,63,210,19,210,102,216,238,197,30,0,12,78,44,65,28,140,66]";
        const secretKey = Uint8Array.from(JSON.parse(secretkeyString));
        return web3_js_1.Keypair.fromSecretKey(secretKey);
    });
}
exports.getPayer = getPayer;
function getStaker() {
    return __awaiter(this, void 0, void 0, function* () {
        const secretkeyString = 
        //   "[232,142,24,24,92,153,114,42,40,155,215,58,39,157,75,253,73,79,216,140,94,56,237,24,58,121,89,42,96,195,143,116,176,68,138,210,49,49,1,145,31,172,242,120,134,134,185,236,61,101,48,76,220,244,24,112,158,203,63,80,171,11,104,180]"
        "[152,208,87,43,142,51,120,17,228,180,176,201,241,199,8,97,149,113,197,86,174,36,3,189,61,165,39,92,45,176,115,9,83,82,31,66,49,11,97,210,230,23,217,153,98,155,28,217,82,233,223,129,6,176,128,250,170,84,43,12,131,153,97,123]";
        const secretKey = Uint8Array.from(JSON.parse(secretkeyString));
        return web3_js_1.Keypair.fromSecretKey(secretKey);
    });
}
exports.getStaker = getStaker;
function getStaker2() {
    return __awaiter(this, void 0, void 0, function* () {
        const secretkeyString = "[232,142,24,24,92,153,114,42,40,155,215,58,39,157,75,253,73,79,216,140,94,56,237,24,58,121,89,42,96,195,143,116,176,68,138,210,49,49,1,145,31,172,242,120,134,134,185,236,61,101,48,76,220,244,24,112,158,203,63,80,171,11,104,180]";
        const secretKey = Uint8Array.from(JSON.parse(secretkeyString));
        return web3_js_1.Keypair.fromSecretKey(secretKey);
    });
}
exports.getStaker2 = getStaker2;
//# sourceMappingURL=Schema.js.map