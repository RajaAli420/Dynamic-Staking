import { connection, programId } from './Main'
import { Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from '@solana/web3.js'
import { u64, publicKey } from '@solana/buffer-layout-utils'
import { u8, struct, u16 } from '@solana/buffer-layout'
import { createPlatformAccount, createStakeAccount, getStaker, getStaker2, StakingInfo, StakingSchema } from './Schema';
import * as borsh from 'borsh'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
export function Owner() {
    const secretkeyString =
        //   "[232,142,24,24,92,153,114,42,40,155,215,58,39,157,75,253,73,79,216,140,94,56,237,24,58,121,89,42,96,195,143,116,176,68,138,210,49,49,1,145,31,172,242,120,134,134,185,236,61,101,48,76,220,244,24,112,158,203,63,80,171,11,104,180]"
        "[108,25,85,145,124,237,134,39,2,125,15,162,68,252,100,203,75,35,24,238,11,36,136,210,125,74,152,211,116,62,220,33,165,215,139,222,106,251,255,189,23,213,30,19,183,23,209,63,210,19,210,102,216,238,197,30,0,12,78,44,65,28,140,66]";
    const secretKey = Uint8Array.from(JSON.parse(secretkeyString));
    return Keypair.fromSecretKey(secretKey);
}
let stakingPlatform = new PublicKey('HJGqfZ2BP6udBfpM8Z2v7giH8fWYpKgLa1gaXE9FN2F4')
let stakingToken = new PublicKey('AhHrdL1JcBDJMsLWCmMeebzR2UyV7FHAx29VCPpLsnYW')
let poolPda = new PublicKey('7M6LR7HHTJCDUdf7RgqxXmhygG2uQUcTGmvdrhmFuLYo')
let poolPdaTokenAccount = new PublicKey('4xYbLt9qrDYKxvQtPosxQEdoyZq3kJwCMuwDXff247Kx')
let ownerTokenAccount = new PublicKey('8evS2o1HPVgCCx1kkrctCGopWd1Ksu82RmP2LLZGQYxj')
let stakePda = new PublicKey('Bx9ofJQhyF4W3jB6tJrUZVwju3XJAMuPeXQU63VpteS7')
let stakePdaTokenAccount = new PublicKey('2rEiavn1gT9pqxbQfsWHdU35vdeQnxJuHCKR1cuic7tZ')
interface InitPlatform {
    instruction: number;
    owner: PublicKey;
    locking_time: bigint;
    apr: number
}
const initPlatformData = struct<InitPlatform>([u8('instruction'), publicKey('owner'), u64('locking_time'), u16('apr')])
export async function initPlatform() {
    let owner = Owner();
    let stakingPlatform = Keypair.generate();
    console.log(stakingPlatform.publicKey.toBase58());
    let stakingPlatformAcc = await createPlatformAccount(stakingPlatform, owner);
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
    }, data)

    let tx = new Transaction().add(stakingPlatformAcc, new TransactionInstruction({ keys, data, programId }))
    let hash = await sendAndConfirmTransaction(connection, tx, [owner, stakingPlatform])
    console.log(hash)
}
interface AddTokenToPool {
    instruction: number
    amount: bigint
}
const addTokenToPoolData = struct<AddTokenToPool>([u8('instruction'), u64('amount')]);
export async function addTokenToPool() {
    let owner = Owner();
    let ownerTokenAccount = await connection.getTokenAccountsByOwner(owner.publicKey, {
        mint: stakingToken,
        programId: TOKEN_PROGRAM_ID
    })
    let poolPda = await PublicKey.findProgramAddress([Buffer.from('DynamicAPRPool')], programId)
    console.log(ownerTokenAccount.value[0].pubkey.toBase58())
    let keys = [{
        pubkey: owner.publicKey,
        isSigner: true,
        isWritable: true
    }, {
        pubkey: ownerTokenAccount.value[0].pubkey,
        isSigner: false,
        isWritable: true
    }, {
        pubkey: stakingPlatform,//staking platform
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
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false
    }, {
        pubkey: poolPda[0],
        isSigner: false,
        isWritable: true
    }]
    let amount = 50000 * 1000000000
    let data = Buffer.alloc(addTokenToPoolData.span);
    addTokenToPoolData.encode({
        instruction: 11,
        amount: BigInt(amount)
    }, data)
    // let tx=new Transaction().add(new TransactionInstruction({ keys, data, programId }))
    // tx.feePayer=owner.publicKey;
    // console.log(await connection.simulateTransaction(tx))
    let hash = await sendAndConfirmTransaction(connection, new Transaction().add(new TransactionInstruction({ keys, data, programId })), [owner])
    console.log(hash)
}
interface Staker {
    instruction: number;
    amount: bigint;
    time_of_stake: bigint
}
const stakerData = struct<Staker>([u8('instruction'), u64('amount'), u64('time_of_stake')])
export async function stake() {
    let staker = await getStaker2();
    console.log(staker.publicKey.toBase58())
    let stakerTokenAccount = await connection.getTokenAccountsByOwner(staker.publicKey, {
        mint: stakingToken,
        programId: TOKEN_PROGRAM_ID
    })
    let stakeAccount = Keypair.generate()
    let stakeAccIxs = await createStakeAccount(stakeAccount, staker)
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
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false
    }];
    let amount = 3000 * 1000000000;
    let data = Buffer.alloc(stakerData.span)
    stakerData.encode({
        instruction: 0,
        amount: BigInt(amount),
        time_of_stake: BigInt(100000)
    }, data)
    let tx=new Transaction().add(stakeAccIxs, new TransactionInstruction({ keys, data, programId }))

    tx.feePayer=staker.publicKey;
    console.log(await connection.simulateTransaction(tx))
    // let hash = await sendAndConfirmTransaction(connection, new Transaction().add(stakeAccIxs, new TransactionInstruction({ keys, data, programId })), [staker, stakeAccount])
    // console.log(hash)
}
interface OnlyInstruction{
    instruction:number
}
const onlyInstructionData=struct<OnlyInstruction>([u8('instruction')]);
export async function unstake(){
    let staker = await getStaker2();

    let keys = [{
        pubkey: staker.publicKey,
        isSigner: true,
        isWritable: true
    }, {
        pubkey: new PublicKey('8fHUG7XKzXog8BA71BubtoUWEetUm9nDSo183yBzWmtd'),
        isSigner: false,
        isWritable: true
    }, {
        pubkey: new PublicKey('QKrx7xqbZW28otJdtq9mywyvjKcxBb5w9JxF4Vcf1Gf'),
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
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false
    },{
        pubkey: stakePda,
        isSigner: false,
        isWritable: false
    }];
    let data=Buffer.alloc(onlyInstructionData.span)
    onlyInstructionData.encode({
        instruction:1
    },data);
    // let tx=new Transaction().add(new TransactionInstruction({ keys, data, programId }))
    // tx.feePayer=staker.publicKey;
    // console.log(await connection.simulateTransaction(tx))
    let hash=await sendAndConfirmTransaction(connection, new Transaction().add(new TransactionInstruction({ keys, data, programId })),[staker])
    console.log(hash)
}
export async function getPlatformData() {
    let data = await connection.getAccountInfo(stakingPlatform);
    let info = borsh.deserializeUnchecked(StakingSchema, StakingInfo, data.data)
    console.log("OWNER : ",info.owner.toBase58())
    console.log("Pool Size: ",parseFloat(info.pool_size.toString()))
    console.log("APR: ",parseInt(info.apr.toString()))
    console.log("TOTAL STAKED :",parseInt(info.total_staked.toString()))
    for(let i = 0; i < info.apr_change_arr.length;i++) {
        console.log( "ITERATION :",i,"REWARD: ",parseFloat(info.apr_change_arr[i].reward_change.toString()),
        "TIME OF CHANGE: ",info.apr_change_arr[i].time_of_change.toString())
        
    }
}

