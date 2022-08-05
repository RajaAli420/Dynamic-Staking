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
exports.getStakerData = exports.getPlatformData = exports.withdrawFromPoolAdmin = exports.claimrReward = exports.unstake = exports.stake = exports.addTokenToPool = exports.initPlatform = exports.Owner = void 0;
const Main_1 = require("./Main");
const web3_js_1 = require("@solana/web3.js");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const buffer_layout_1 = require("@solana/buffer-layout");
const Schema_1 = require("./Schema");
const borsh = __importStar(require("borsh"));
const spl_token_1 = require("@solana/spl-token");
function Owner() {
    const secretkeyString = 
    //   "[232,142,24,24,92,153,114,42,40,155,215,58,39,157,75,253,73,79,216,140,94,56,237,24,58,121,89,42,96,195,143,116,176,68,138,210,49,49,1,145,31,172,242,120,134,134,185,236,61,101,48,76,220,244,24,112,158,203,63,80,171,11,104,180]"
    "[108,25,85,145,124,237,134,39,2,125,15,162,68,252,100,203,75,35,24,238,11,36,136,210,125,74,152,211,116,62,220,33,165,215,139,222,106,251,255,189,23,213,30,19,183,23,209,63,210,19,210,102,216,238,197,30,0,12,78,44,65,28,140,66]";
    const secretKey = Uint8Array.from(JSON.parse(secretkeyString));
    return web3_js_1.Keypair.fromSecretKey(secretKey);
}
exports.Owner = Owner;
let stakingPlatform = new web3_js_1.PublicKey('BuEm1DhPJa5AfEubViWtEvjXa6XTJpN3NHzLXz1vGZGB');
let stakingToken = new web3_js_1.PublicKey('AhHrdL1JcBDJMsLWCmMeebzR2UyV7FHAx29VCPpLsnYW');
let poolPda = new web3_js_1.PublicKey('CQXvTTrveKewa3FtG5FunYZLQhDo6vcJYjWr3nnrMQZu');
let poolPdaTokenAccount = new web3_js_1.PublicKey('HvhTWX5uQNsPYwXkhLPqSCjBX3as58jEAogqR9ATuUm7');
let ownerTokenAccount = new web3_js_1.PublicKey('8evS2o1HPVgCCx1kkrctCGopWd1Ksu82RmP2LLZGQYxj');
let stakePda = new web3_js_1.PublicKey('4ivwjYyJHg8syR28urBVjgbzCSxymk5c27pQ3ytuDd22');
let stakePdaTokenAccount = new web3_js_1.PublicKey('7ZhtSX9VC9SdUKfK6hwHuLtWfRxJrCPary4xSYug5pFS');
const initPlatformData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction'), (0, buffer_layout_utils_1.publicKey)('owner'), (0, buffer_layout_utils_1.u64)('locking_time'), (0, buffer_layout_utils_1.u64)('apr')]);
function initPlatform() {
    return __awaiter(this, void 0, void 0, function* () {
        let owner = Owner();
        console.log(owner.publicKey.toBase58());
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
            apr: BigInt(3000),
        }, data);
        let tx = new web3_js_1.Transaction().add(stakingPlatformAcc, new web3_js_1.TransactionInstruction({ keys, data, programId: Main_1.programId }));
        let hash = yield (0, web3_js_1.sendAndConfirmTransaction)(Main_1.connection, tx, [owner, stakingPlatform]);
        console.log(hash);
    });
}
exports.initPlatform = initPlatform;
const addTokenToPoolData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction'), (0, buffer_layout_utils_1.u64)('amount')]);
function addTokenToPool() {
    return __awaiter(this, void 0, void 0, function* () {
        let owner = Owner();
        let ownerTokenAccount = yield Main_1.connection.getTokenAccountsByOwner(owner.publicKey, {
            mint: stakingToken,
            programId: spl_token_1.TOKEN_PROGRAM_ID
        });
        let poolPda = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from('DynamicAPRPool')], Main_1.programId);
        console.log(ownerTokenAccount.value[0].pubkey.toBase58());
        let keys = [{
                pubkey: owner.publicKey,
                isSigner: true,
                isWritable: true
            }, {
                pubkey: ownerTokenAccount.value[0].pubkey,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: stakingPlatform,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: poolPdaTokenAccount,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: stakingToken,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: spl_token_1.TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            }, {
                pubkey: poolPda[0],
                isSigner: false,
                isWritable: true
            }];
        let amount = 50000 * 1000000000;
        let data = Buffer.alloc(addTokenToPoolData.span);
        addTokenToPoolData.encode({
            instruction: 11,
            amount: BigInt(amount)
        }, data);
        // let tx=new Transaction().add(new TransactionInstruction({ keys, data, programId }))
        // tx.feePayer=owner.publicKey;
        // console.log(await connection.simulateTransaction(tx))
        let hash = yield (0, web3_js_1.sendAndConfirmTransaction)(Main_1.connection, new web3_js_1.Transaction().add(new web3_js_1.TransactionInstruction({ keys, data, programId: Main_1.programId })), [owner]);
        console.log(hash);
    });
}
exports.addTokenToPool = addTokenToPool;
const stakerData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction'), (0, buffer_layout_utils_1.u64)('amount'), (0, buffer_layout_utils_1.u64)('time_of_stake')]);
function stake() {
    return __awaiter(this, void 0, void 0, function* () {
        let staker = yield (0, Schema_1.getStaker2)();
        console.log(staker.publicKey.toBase58());
        let stakerTokenAccount = yield Main_1.connection.getTokenAccountsByOwner(staker.publicKey, {
            mint: stakingToken,
            programId: spl_token_1.TOKEN_PROGRAM_ID
        });
        console.log(stakerTokenAccount.value[0].pubkey.toBase58());
        let stakeAccount = web3_js_1.Keypair.generate();
        let stakeAccIxs = yield (0, Schema_1.createStakeAccount)(stakeAccount, staker);
        let keys = [{
                pubkey: staker.publicKey,
                isSigner: true,
                isWritable: true
            }, {
                pubkey: stakerTokenAccount.value[0].pubkey,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: stakeAccount.publicKey,
                isSigner: true,
                isWritable: true
            }, {
                pubkey: stakingPlatform,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: stakePdaTokenAccount,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: stakingToken,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: spl_token_1.TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            }];
        let amount = 4000 * 1000000000;
        let data = Buffer.alloc(stakerData.span);
        stakerData.encode({
            instruction: 0,
            amount: BigInt(amount),
            time_of_stake: BigInt(100000)
        }, data);
        let tx = new web3_js_1.Transaction().add(stakeAccIxs, new web3_js_1.TransactionInstruction({ keys, data, programId: Main_1.programId }));
        tx.feePayer = staker.publicKey;
        console.log(yield Main_1.connection.simulateTransaction(tx));
        let hash = yield (0, web3_js_1.sendAndConfirmTransaction)(Main_1.connection, new web3_js_1.Transaction().add(stakeAccIxs, new web3_js_1.TransactionInstruction({ keys, data, programId: Main_1.programId })), [staker, stakeAccount]);
        console.log(hash);
    });
}
exports.stake = stake;
const onlyInstructionData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction')]);
function unstake() {
    return __awaiter(this, void 0, void 0, function* () {
        let staker = yield (0, Schema_1.getStaker)();
        let stakerTokenAcc = yield Main_1.connection.getTokenAccountsByOwner(staker.publicKey, {
            mint: stakingToken,
            programId: spl_token_1.TOKEN_PROGRAM_ID
        });
        let stakeAcc = yield getStakerData(staker.publicKey.toBase58());
        for (let i = 0; i < stakeAcc.length; i++) {
            let keys = [{
                    pubkey: staker.publicKey,
                    isSigner: true,
                    isWritable: true
                }, {
                    pubkey: stakerTokenAcc.value[0].pubkey,
                    isSigner: false,
                    isWritable: true
                }, {
                    pubkey: stakeAcc[i].pubkey,
                    isSigner: false,
                    isWritable: true
                }, {
                    pubkey: stakingPlatform,
                    isSigner: false,
                    isWritable: true
                }, {
                    pubkey: stakePdaTokenAccount,
                    isSigner: false,
                    isWritable: true
                }, {
                    pubkey: stakingToken,
                    isSigner: false,
                    isWritable: true
                }, {
                    pubkey: spl_token_1.TOKEN_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false
                }, {
                    pubkey: stakePda,
                    isSigner: false,
                    isWritable: false
                }];
            let data = Buffer.alloc(onlyInstructionData.span);
            onlyInstructionData.encode({
                instruction: 1
            }, data);
            // let tx=new Transaction().add(new TransactionInstruction({ keys, data, programId }))
            // tx.feePayer=staker.publicKey;
            // console.log(await connection.simulateTransaction(tx))
            let hash = yield (0, web3_js_1.sendAndConfirmTransaction)(Main_1.connection, new web3_js_1.Transaction().add(new web3_js_1.TransactionInstruction({ keys, data, programId: Main_1.programId })), [staker]);
            console.log(hash);
        }
    });
}
exports.unstake = unstake;
function claimrReward() {
    return __awaiter(this, void 0, void 0, function* () {
        let staker = yield (0, Schema_1.getStaker)();
        let stakeAcc = yield getStakerData(staker.publicKey.toBase58());
        console.log(staker.publicKey.toBase58());
        let keys = [{
                pubkey: staker.publicKey,
                isSigner: true,
                isWritable: true
            }, {
                pubkey: new web3_js_1.PublicKey('5CvV1pBumVcYdoeNGQo3YorxD24FAAMjuWwN4PiganXn'),
                isSigner: false,
                isWritable: true
            }, {
                pubkey: stakeAcc[0].pubkey,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: stakingPlatform,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: poolPdaTokenAccount,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: stakingToken,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: spl_token_1.TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            }, {
                pubkey: poolPda,
                isSigner: false,
                isWritable: false
            }];
        let data = Buffer.alloc(onlyInstructionData.span);
        onlyInstructionData.encode({
            instruction: 3
        }, data);
        // let tx=new Transaction().add(new TransactionInstruction({ keys, data, programId }))
        // tx.feePayer=staker.publicKey;
        // console.log(await connection.simulateTransaction(tx))
        let hash = yield (0, web3_js_1.sendAndConfirmTransaction)(Main_1.connection, new web3_js_1.Transaction().add(new web3_js_1.TransactionInstruction({ keys, data, programId: Main_1.programId })), [staker]);
        console.log(hash);
    });
}
exports.claimrReward = claimrReward;
function withdrawFromPoolAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        let owner = Owner();
        let ownerTokenAccount = yield Main_1.connection.getTokenAccountsByOwner(owner.publicKey, {
            mint: stakingToken,
            programId: spl_token_1.TOKEN_PROGRAM_ID
        });
        let poolPda = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from('DynamicAPRPool')], Main_1.programId);
        console.log(ownerTokenAccount.value[0].pubkey.toBase58());
        let keys = [{
                pubkey: owner.publicKey,
                isSigner: true,
                isWritable: true
            }, {
                pubkey: ownerTokenAccount.value[0].pubkey,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: stakingPlatform,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: poolPdaTokenAccount,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: stakingToken,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: spl_token_1.TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            }, {
                pubkey: poolPda[0],
                isSigner: false,
                isWritable: true
            }];
        let data = Buffer.alloc(onlyInstructionData.span);
        onlyInstructionData.encode({
            instruction: 9
        }, data);
        // let tx=new Transaction().add(new TransactionInstruction({ keys, data, programId }))
        // tx.feePayer=owner.publicKey;
        // console.log(await connection.simulateTransaction(tx))
        let hash = yield (0, web3_js_1.sendAndConfirmTransaction)(Main_1.connection, new web3_js_1.Transaction().add(new web3_js_1.TransactionInstruction({ keys, data, programId: Main_1.programId })), [owner]);
        console.log(hash);
    });
}
exports.withdrawFromPoolAdmin = withdrawFromPoolAdmin;
function getPlatformData() {
    return __awaiter(this, void 0, void 0, function* () {
        let data = yield Main_1.connection.getAccountInfo(stakingPlatform);
        let info = borsh.deserializeUnchecked(Schema_1.StakingSchema, Schema_1.StakingInfo, data.data);
        let total = parseFloat(info.pool_size.toString()) / 100000000;
        console.log("OWNER : ", info.owner.toBase58());
        console.log("Pool Size: ", parseFloat(info.pool_size.toString()) / 100000000);
        console.log("APR: ", parseInt(info.apr.toString()));
        console.log("TOTAL STAKED :", parseInt(info.total_staked.toString()) / 100000000);
        for (let i = 0; i < info.apr_change_arr.length; i++) {
            if (i > 0) {
                if (i == info.apr_change_arr.length - 1) {
                    console.log("ITERATION :", i, "REWARD: ", parseFloat(info.apr_change_arr[i].reward_change.toString()), "TIME OF CHANGE: ", info.apr_change_arr[i].time_of_change.toString(), "APR :", parseInt(info.apr_change_arr[i].new_apr.toString()) / 10000000000);
                }
                else {
                    total += parseFloat(info.apr_change_arr[i].reward_change.toString()) / 100000000;
                    console.log("ITERATION :", i, "REWARD: ", parseFloat(info.apr_change_arr[i].reward_change.toString()) / 100000000, "TIME OF CHANGE: ", info.apr_change_arr[i].time_of_change.toString(), "APR :", parseInt(info.apr_change_arr[i].new_apr.toString()) / 10000000000);
                }
            }
            else {
                total += parseFloat(info.apr_change_arr[i].reward_change.toString()) / 100000000;
                console.log("ITERATION :", i, "REWARD: ", parseFloat(info.apr_change_arr[i].reward_change.toString()) / 100000000, "TIME OF CHANGE: ", info.apr_change_arr[i].time_of_change.toString(), "APR :", parseInt(info.apr_change_arr[i].new_apr.toString()) / 100);
            }
        }
        console.log("VERIFYING POOL SIZE AFTER ADDING THE ABOVE REWARDS EXCEPT ITERATION 5 :", total);
    });
}
exports.getPlatformData = getPlatformData;
// 1659348142
function getStakerData(staker) {
    return __awaiter(this, void 0, void 0, function* () {
        let stakeAcc = yield Main_1.connection.getProgramAccounts(Main_1.programId, {
            commitment: "confirmed",
            filters: [
                { dataSize: 57 },
                {
                    memcmp: {
                        offset: 1,
                        bytes: staker
                    },
                },
            ],
        });
        console.log(stakeAcc.length);
        for (let i = 0; i < stakeAcc.length; i++) {
            let data = borsh.deserialize(Schema_1.StakingSchema, Schema_1.Stakers, stakeAcc[i].account.data);
            console.log(data.wallet_address.toBase58());
            console.log(data.amount.toString());
        }
        return stakeAcc;
    });
}
exports.getStakerData = getStakerData;
//# sourceMappingURL=Functions.js.map