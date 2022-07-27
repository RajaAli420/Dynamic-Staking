import {  Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import { extendBorsh } from './borsh'
import * as borsh from 'borsh'
import { connection, programId } from "./Main";

export class StakingInfo {
    is_initialized: boolean;
    owner: PublicKey;
    apr: number;
    total_staked: number;
    total_stakers: number;
    pool_size: number;
    staking_period: number;
    emergency_stop: boolean;
    claimed_rewards: number;
    claimable_rewards: number;
    apr_change_arr: APRChange[];
    constructor(fields: any) {
        this.is_initialized = fields.is_initialized
        this.owner = fields.owner
        this.apr = fields.apr
        this.total_staked = fields.total_staked
        this.total_stakers = fields.total_stakers
        this.pool_size = fields.pool_size
        this.staking_period = fields.staking_period
        this.emergency_stop = fields.emergency_stop
        this.claimed_rewards = fields.claimed_rewards
        this.claimable_rewards = fields.claimable_rewards
        this.apr_change_arr = fields.apr_change_arr
    }
}
export class APRChange {
    new_apr: number;
    time_of_change: number;
    reward_change: number;
    constructor(fields: any) {
        this.new_apr = fields.new_apr
        this.time_of_change = fields.time_of_change
        this.reward_change = fields.reward_change
    }
}
export class Stakers {
    is_initialized: number
    wallet_address: PublicKey;
    amount: number;
    time_of_stake: number;
    staking_time_period: number;
    constructor(fields:any) {
        this.is_initialized = fields.is_initialized
        this.wallet_address = fields.wallet_address
        this.amount = fields.amount
        this.time_of_stake = fields.time_of_stake
        this.staking_time_period = fields.staking_time_period
    }
}

export const StakingSchema = new Map<any, any>([
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



extendBorsh();
export async function createPlatformAccount(platformAccount:Keypair, payerAccount:Keypair) {
    let test: APRChange[] = []
    for (let i = 0; i < 1000; i++) {
        test.push(new APRChange({ new_apr: 0, time_of_change: 0, reward_change: 0 }))
    }
    let platformSize = borsh.serialize(StakingSchema, new StakingInfo({
        is_initialized: false,
        owner: new PublicKey(0),
        apr: 0,
        total_staked: 0,
        total_stakers: 0,
        pool_size: 0,
        staking_period: 0,
        emergency_stop: false,
        claimed_rewards: 0,
        claimable_rewards: 0,
        apr_change_arr: test
    })).length
    console.log(platformSize)

    return SystemProgram.createAccount({
        fromPubkey: payerAccount.publicKey,
        newAccountPubkey: platformAccount.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(platformSize),
        space: platformSize,
        programId: programId

    })

}

export async function createStakeAccount(stakerAccount, payerAccount) {
    let tx = new Transaction();

    let stakeAccountSize = borsh.serialize(StakingSchema, new Stakers({
        is_initialized: false,
        wallet_address: new PublicKey(0),
        amount: 0,
        time_of_stake: 0,
        staking_time_period: 0
    })).length
    return tx.add(SystemProgram.createAccount({
        fromPubkey: payerAccount.publicKey,
        newAccountPubkey: stakerAccount.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(stakeAccountSize),
        space: stakeAccountSize,
        programId: programId,

    }))

}
export async function getPayer() {
    const secretkeyString =
        //   "[232,142,24,24,92,153,114,42,40,155,215,58,39,157,75,253,73,79,216,140,94,56,237,24,58,121,89,42,96,195,143,116,176,68,138,210,49,49,1,145,31,172,242,120,134,134,185,236,61,101,48,76,220,244,24,112,158,203,63,80,171,11,104,180]"
        "[108,25,85,145,124,237,134,39,2,125,15,162,68,252,100,203,75,35,24,238,11,36,136,210,125,74,152,211,116,62,220,33,165,215,139,222,106,251,255,189,23,213,30,19,183,23,209,63,210,19,210,102,216,238,197,30,0,12,78,44,65,28,140,66]";
    const secretKey = Uint8Array.from(JSON.parse(secretkeyString));
    return Keypair.fromSecretKey(secretKey);
}
export async function getStaker() {
    const secretkeyString =
        //   "[232,142,24,24,92,153,114,42,40,155,215,58,39,157,75,253,73,79,216,140,94,56,237,24,58,121,89,42,96,195,143,116,176,68,138,210,49,49,1,145,31,172,242,120,134,134,185,236,61,101,48,76,220,244,24,112,158,203,63,80,171,11,104,180]"
        "[152,208,87,43,142,51,120,17,228,180,176,201,241,199,8,97,149,113,197,86,174,36,3,189,61,165,39,92,45,176,115,9,83,82,31,66,49,11,97,210,230,23,217,153,98,155,28,217,82,233,223,129,6,176,128,250,170,84,43,12,131,153,97,123]"
    const secretKey = Uint8Array.from(JSON.parse(secretkeyString));
    return Keypair.fromSecretKey(secretKey);
}
export async function getStaker2() {
    const secretkeyString =
        "[232,142,24,24,92,153,114,42,40,155,215,58,39,157,75,253,73,79,216,140,94,56,237,24,58,121,89,42,96,195,143,116,176,68,138,210,49,49,1,145,31,172,242,120,134,134,185,236,61,101,48,76,220,244,24,112,158,203,63,80,171,11,104,180]"

    const secretKey = Uint8Array.from(JSON.parse(secretkeyString));
    return Keypair.fromSecretKey(secretKey);
}