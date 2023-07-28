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
                ['apr', 'u64'],
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
                ['new_apr', 'u64'],
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

export async function createStakeAccount(stakerAccount:Keypair, payerAccount:Keypair) {
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
