import { Connection, PublicKey } from "@solana/web3.js";
import { addTokenToPool, claimrReward, getPlatformData, getStakerData, initPlatform, stake, unstake, withdrawFromPoolAdmin } from "./Functions";
import { createPlatformAccount } from "./Schema";


export const programId=new PublicKey("6JR9Z5krBSdP2PD9fwFN9W3xLzsDa5StcNu338g9ygBX")
export const connection=new Connection("https://api.devnet.solana.com")
async function  main(){
    // await initPlatform()
    // await addTokenToPool()
    await stake()
    // await unstake()
    // await withdrawFromPoolAdmin()
    // await claimrReward()
    await getPlatformData()
    // await getStakerData('6cFU9keNVZGYNtFBLkE4MdD5VpNsjw94Y756ooidEcPk')
//     let stakepda = await PublicKey.findProgramAddress([Buffer.from('DynamicAPR')], programId)
// let poolPda = await PublicKey.findProgramAddress([Buffer.from('DynamicAPRPool')], programId)
// console.log("STAKE PDA: ",stakepda[0].toBase58(),'\n',"POOL PDA :",poolPda[0].toBase58())
    
}
main()


















