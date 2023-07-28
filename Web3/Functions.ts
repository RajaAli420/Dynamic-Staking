import { connection, programId } from './Main'
import { Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from '@solana/web3.js'
import { u64, publicKey } from '@solana/buffer-layout-utils'
import { u8, struct, u16 } from '@solana/buffer-layout'
import { createPlatformAccount, createStakeAccount, getStaker, getStaker2, getStaker3, Stakers, StakingInfo, StakingSchema } from './Schema';
import * as borsh from 'borsh'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
export function Owner() {
    const secretkeyString ="";
    const secretKey = Uint8Array.from(JSON.parse(secretkeyString));
    return Keypair.fromSecretKey(secretKey);
}

let stakingPlatform = new PublicKey('BuEm1DhPJa5AfEubViWtEvjXa6XTJpN3NHzLXz1vGZGB')
let stakingToken = new PublicKey('AhHrdL1JcBDJMsLWCmMeebzR2UyV7FHAx29VCPpLsnYW')
let poolPda = new PublicKey('CQXvTTrveKewa3FtG5FunYZLQhDo6vcJYjWr3nnrMQZu')
let poolPdaTokenAccount = new PublicKey('HvhTWX5uQNsPYwXkhLPqSCjBX3as58jEAogqR9ATuUm7')
let ownerTokenAccount = new PublicKey('8evS2o1HPVgCCx1kkrctCGopWd1Ksu82RmP2LLZGQYxj')
let stakePda = new PublicKey('4ivwjYyJHg8syR28urBVjgbzCSxymk5c27pQ3ytuDd22')
let stakePdaTokenAccount = new PublicKey('7ZhtSX9VC9SdUKfK6hwHuLtWfRxJrCPary4xSYug5pFS')
interface InitPlatform {
    instruction: number;
    owner: PublicKey;
    locking_time: bigint;
    apr: bigint
}
const initPlatformData = struct<InitPlatform>([u8('instruction'), publicKey('owner'), u64('locking_time'), u64('apr')])
export async function initPlatform() {

    let owner = Owner();
    console.log(owner.publicKey.toBase58())
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
        apr: BigInt(3000),
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
    console.log(stakerTokenAccount.value[0].pubkey.toBase58())
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
    let amount = 4000 * 1000000000;
    let data = Buffer.alloc(stakerData.span)
    stakerData.encode({
        instruction: 0,
        amount: BigInt(amount),
        time_of_stake: BigInt(100000)
    }, data)
    let tx = new Transaction().add(stakeAccIxs, new TransactionInstruction({ keys, data, programId }))

    tx.feePayer = staker.publicKey;
    console.log(await connection.simulateTransaction(tx))
    let hash = await sendAndConfirmTransaction(connection, new Transaction().add(stakeAccIxs, new TransactionInstruction({ keys, data, programId })), [staker, stakeAccount])
    console.log(hash)
}
interface OnlyInstruction {
    instruction: number
}
const onlyInstructionData = struct<OnlyInstruction>([u8('instruction')]);
export async function unstake() {
    let staker = await getStaker();
    let stakerTokenAcc = await connection.getTokenAccountsByOwner(staker.publicKey, {
        mint: stakingToken,
        programId: TOKEN_PROGRAM_ID
    });
    let stakeAcc=await getStakerData(staker.publicKey.toBase58())
    
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
            pubkey: TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false
        }, {
            pubkey: stakePda,
            isSigner: false,
            isWritable: false
        }];
        let data = Buffer.alloc(onlyInstructionData.span)
        onlyInstructionData.encode({
            instruction: 1
        }, data);
        // let tx=new Transaction().add(new TransactionInstruction({ keys, data, programId }))
        // tx.feePayer=staker.publicKey;
        // console.log(await connection.simulateTransaction(tx))
        let hash = await sendAndConfirmTransaction(connection, new Transaction().add(new TransactionInstruction({ keys, data, programId })), [staker])
        console.log(hash)
    }
}
export async function claimrReward() {
    let staker = await getStaker();
    let stakeAcc=await getStakerData(staker.publicKey.toBase58());
    
    console.log(staker.publicKey.toBase58())
    let keys = [{
        pubkey: staker.publicKey,
        isSigner: true,
        isWritable: true
    }, {
        pubkey: new PublicKey('5CvV1pBumVcYdoeNGQo3YorxD24FAAMjuWwN4PiganXn'),
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
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false
    }, {
        pubkey: poolPda,
        isSigner: false,
        isWritable: false
    }];
    let data = Buffer.alloc(onlyInstructionData.span)
    onlyInstructionData.encode({
        instruction: 3
    }, data);
    // let tx=new Transaction().add(new TransactionInstruction({ keys, data, programId }))
    // tx.feePayer=staker.publicKey;
    // console.log(await connection.simulateTransaction(tx))
    let hash = await sendAndConfirmTransaction(connection, new Transaction().add(new TransactionInstruction({ keys, data, programId })), [staker])
    console.log(hash)
}
export async function withdrawFromPoolAdmin() {
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
    let data = Buffer.alloc(onlyInstructionData.span)
    onlyInstructionData.encode({
        instruction: 9
    }, data);
    // let tx=new Transaction().add(new TransactionInstruction({ keys, data, programId }))
    // tx.feePayer=owner.publicKey;
    // console.log(await connection.simulateTransaction(tx))
    let hash = await sendAndConfirmTransaction(connection, new Transaction().add(new TransactionInstruction({ keys, data, programId })), [owner])
    console.log(hash)
}

export async function getPlatformData() {
    let data = await connection.getAccountInfo(stakingPlatform);
    let info = borsh.deserializeUnchecked(StakingSchema, StakingInfo, data.data)
    let total = parseFloat(info.pool_size.toString())/100000000;
    console.log("OWNER : ", info.owner.toBase58())
    console.log("Pool Size: ", parseFloat(info.pool_size.toString())/100000000)
    console.log("APR: ", parseInt(info.apr.toString()))
    console.log("TOTAL STAKED :", parseInt(info.total_staked.toString())/100000000)
    for (let i = 0; i < info.apr_change_arr.length; i++) {

        if (i > 0) {

            if (i == info.apr_change_arr.length - 1) {

                console.log("ITERATION :", i, "REWARD: ", parseFloat(info.apr_change_arr[i].reward_change.toString()),
                    "TIME OF CHANGE: ", info.apr_change_arr[i].time_of_change.toString(), "APR :", parseInt(info.apr_change_arr[i].new_apr.toString()) / 10000000000)
            } else {
                total += parseFloat(info.apr_change_arr[i].reward_change.toString()) / 100000000
                console.log("ITERATION :", i, "REWARD: ", parseFloat(info.apr_change_arr[i].reward_change.toString()) / 100000000,
                    "TIME OF CHANGE: ", info.apr_change_arr[i].time_of_change.toString(), "APR :", parseInt(info.apr_change_arr[i].new_apr.toString()) / 10000000000)
            }
        } else {
            total += parseFloat(info.apr_change_arr[i].reward_change.toString()) / 100000000
            console.log("ITERATION :", i, "REWARD: ", parseFloat(info.apr_change_arr[i].reward_change.toString())/ 100000000,
                "TIME OF CHANGE: ", info.apr_change_arr[i].time_of_change.toString(), "APR :", parseInt(info.apr_change_arr[i].new_apr.toString()) / 100)
        }

    }
    console.log("VERIFYING POOL SIZE AFTER ADDING THE ABOVE REWARDS EXCEPT ITERATION 5 :", total)
}

// 1659348142

export async function getStakerData(staker) {
    
    let stakeAcc = await connection.getProgramAccounts(programId, {
        commitment: "confirmed",
        filters: [
            {dataSize:57},
          {
            memcmp: {
              offset: 1,
              bytes: staker
            },
          },
        ],
      });
      
      
      console.log(stakeAcc.length)
      for(let i = 0; i < stakeAcc.length; i++){
        let data=borsh.deserialize(StakingSchema,Stakers,stakeAcc[i].account.data)
        console.log(data.wallet_address.toBase58())
        console.log(data.amount.toString())
      }
      return stakeAcc
}
