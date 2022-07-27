import { Connection, PublicKey } from "@solana/web3.js";
import { getPlatformData, initPlatform } from "./Functions";
import { createPlatformAccount } from "./Schema";


export const programId=new PublicKey("ChVWFvL2eq5mgEyffo6G3NtQMRMtdGLjrSmVBjyekJbZ")
export const connection=new Connection("https://api.devnet.solana.com")
async function  main(){
    // await initPlatform()
    await getPlatformData()
}
main()