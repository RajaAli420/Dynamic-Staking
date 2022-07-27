import { connection, programId } from './Main'
import { Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from '@solana/web3.js'
import { u64, publicKey } from '@solana/buffer-layout-utils'
import { u8, struct, u16 } from '@solana/buffer-layout'
import { createPlatformAccount, StakingInfo, StakingSchema } from './Schema';
import * as borsh from 'borsh'
export function Owner() {
    const secretkeyString =
        //   "[232,142,24,24,92,153,114,42,40,155,215,58,39,157,75,253,73,79,216,140,94,56,237,24,58,121,89,42,96,195,143,116,176,68,138,210,49,49,1,145,31,172,242,120,134,134,185,236,61,101,48,76,220,244,24,112,158,203,63,80,171,11,104,180]"
        "[108,25,85,145,124,237,134,39,2,125,15,162,68,252,100,203,75,35,24,238,11,36,136,210,125,74,152,211,116,62,220,33,165,215,139,222,106,251,255,189,23,213,30,19,183,23,209,63,210,19,210,102,216,238,197,30,0,12,78,44,65,28,140,66]";
    const secretKey = Uint8Array.from(JSON.parse(secretkeyString));
    return Keypair.fromSecretKey(secretKey);
}
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
        instruction:4,
        owner:owner.publicKey,
        locking_time:BigInt(123213123),
        apr:3000,
    },data)
    
    let tx=new Transaction().add(stakingPlatformAcc,new TransactionInstruction({keys,data,programId}))
    let hash=await sendAndConfirmTransaction(connection, tx,[owner,stakingPlatform])
    console.log(hash)
}
export async function getPlatformData(){
    let data=await connection.getAccountInfo(new PublicKey('BkUoEEFPeBTAxWTtNtjsn3Yp2H3PkMKSrgunHd4D5HZv'));
    let info=borsh.deserializeUnchecked(StakingSchema,StakingInfo,data.data)
    console.log(info)
}

