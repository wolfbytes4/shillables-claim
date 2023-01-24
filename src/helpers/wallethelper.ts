import { SecretNetworkClient } from "secretjs";
export async function getPermit(address: string){
    let data = localStorage.getItem(`wolf-pack-permit-${process.env.REACT_APP_PACK_CONTRACT_ADDRESS}-${address}`);
    if (data) { return JSON.parse(data); }

     const permitName = "wolf.pack";
     const allowedTokens = [process.env.REACT_APP_PACK_CONTRACT_ADDRESS, process.env.REACT_APP_QUEST_CONTRACT_ADDRESS, process.env.REACT_APP_SHILL_CONTRACT_ADDRESS];
     const permissions = ["owner","balance"];

    if (!window.keplr) throw "Keplr not found";
  
    window.keplr.enable(process.env.REACT_APP_CHAIN_ID);
  
    const { signature } = await window.keplr.signAmino(
      process.env.REACT_APP_CHAIN_ID,
      address,
      {
        chain_id: process.env.REACT_APP_CHAIN_ID,
        account_number: "0", // Must be 0
        sequence: "0", // Must be 0
        fee: {
          amount: [{ denom: "uscrt", amount: "0" }], // Must be 0 uscrt
          gas: "1", // Must be 1
        },
        msgs: [
          {
            type: "query_permit", // Must be "query_permit"
            value: {
              permit_name: permitName,
              allowed_tokens: allowedTokens,
              permissions: permissions,
            },
          },
        ],
        memo: "", // Must be empty
      },
      {
        preferNoSetFee: true, // Fee must be 0, so hide it from the user
        preferNoSetMemo: true, // Memo must be empty, so hide it from the user
      }
    );
    localStorage.setItem(`wolf-pack-permit-${process.env.REACT_APP_PACK_CONTRACT_ADDRESS}-${address}`, JSON.stringify(signature));
    return signature;
  }

  export async function getWalletClient() { 
    if (!window.keplr) throw "Keplr not found";
    const chainID = process.env.REACT_APP_CHAIN_ID;
    window.keplr.enable(chainID);

    const offlineSigner = window.keplr.getOfflineSignerOnlyAmino(chainID);
    const [{ address: myAddress }] = await offlineSigner.getAccounts();
    const enigmaUtils = window.keplr.getEnigmaUtils(chainID);

    const client = new SecretNetworkClient({
        url: process.env.REACT_APP_GRPC_URL,
        chainId: chainID,
        wallet: offlineSigner,
        walletAddress: myAddress,
        encryptionUtils: enigmaUtils,
    });

    return {
      client: client,
      address: myAddress
    }
  }

  export async function setKeplrViewingKey() {
    if (!window.keplr) throw "Keplr not found";
  
    await window.keplr.suggestToken(process.env.REACT_APP_CHAIN_ID, process.env.REACT_APP_SHILL_CONTRACT_ADDRESS);
  }
  
  export async function getKeplrViewingKey( 
  ): Promise<string | null> { 
    if (!window.keplr) throw "Keplr not found";
  
    try {
      return await window.keplr.getSecret20ViewingKey(process.env.REACT_APP_CHAIN_ID, process.env.REACT_APP_SHILL_CONTRACT_ADDRESS);
    } catch (e) {
      return null;
    }
  }