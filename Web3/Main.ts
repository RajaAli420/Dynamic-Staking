import { Connection, PublicKey } from "@solana/web3.js";
import { addTokenToPool, getPlatformData, initPlatform, stake, unstake } from "./Functions";
import { createPlatformAccount } from "./Schema";


export const programId=new PublicKey("7AAdUKbqNPxC4ng5cDsYpuxfHDcNsJhBnpwHUPhimbwz")
export const connection=new Connection("https://api.devnet.solana.com")
async function  main(){
    // await initPlatform()
    await addTokenToPool()
    await stake()
    // await unstake()
    await getPlatformData()
    
}
main()



















// let stakepda = await PublicKey.findProgramAddress([Buffer.from('DynamicAPR')], programId)
// let poolPda = await PublicKey.findProgramAddress([Buffer.from('DynamicAPRPool')], programId)
// console.log("STAKE PDA: ",stakepda[0].toBase58(),'\n',"POOL PDA :",poolPda[0].toBase58())