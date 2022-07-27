import { Connection, PublicKey } from "@solana/web3.js";
import { createPlatformAccount } from "./Schema";


export const programId=new PublicKey("D5EAiEZGuAvJL8woxDNjyW2VDuR89FXEXg37deAJVohi")
export const connection=new Connection("https://api.devnet.solana.com")
async function  main(){
    await createPlatformAccount("","")
}
main()