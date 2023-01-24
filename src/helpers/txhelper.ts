import { MsgExecuteContract } from "secretjs";
import { parseTxError } from './errorhelper.ts';

export const txWrapper = async (
    msg,
    contract,
    hash,
    gas,
    checkErrors = true,
    walletClient
  ) => { 
    try {   
      debugger;
      const execMsg = new MsgExecuteContract({
        sender: walletClient.address,
        contract_address: contract,
        code_hash: hash, 
        msg
      });
      const response = await walletClient.client.tx.broadcast([execMsg],
      {
        gasLimit: gas,
      }); 
        console.log('Message:', JSON.stringify(msg, undefined, 2));
        console.log('Response:', response);
        if (checkErrors) parseTxError(response);
        return response;
    } catch (error) {
        console.error(error);
        if (
            error.toString().includes('Network Error') ||
            error.toString().includes('503') ||
            error.toString().includes('Response closed without headers')
        ) {
            throw 'Failed to access network. The node may be experiencing issues.';
        } else {
            throw error;
        }
    }
};