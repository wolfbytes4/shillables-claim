import { SecretNetworkClient } from "secretjs";
import { Snip721GetTokensResponse } from "secretjs/dist/extensions/snip721/msg/GetTokens";
import { Metadata } from "secretjs/dist/extensions/snip721/types";


export const permitName = "wolf.pack";
export const allowedTokens = [process.env.REACT_APP_PACK_CONTRACT_ADDRESS, process.env.REACT_APP_QUEST_CONTRACT_ADDRESS, process.env.REACT_APP_SHILL_CONTRACT_ADDRESS];
export const permissions = ["owner", "balance"];

const chainId = process.env.REACT_APP_CHAIN_ID;

export let queryJs: SecretNetworkClient;

export interface DossierResponse {
    nft_dossier: NftDossier;
}
  
export interface BatchDossierResponse {
    batch_nft_dossier: _BatchDossiers;
}
  
export interface _BatchDossiers {
    nft_dossiers: BatchNftDossier[];
}
  
export interface NftDossier {
    display_private_metadata_error: string | null;
    owner: string | null;
    private_metadata: Metadata;
    private_metadata_is_public: boolean;
    public_metadata: Metadata;
    token_approvals: any[];
}
  
export interface BatchNftDossier extends NftDossier {
    token_id: string;
}
 
export const PermitQuery = class {
    with_permit: {
      query: any,
      permit: {
        params: {
          permit_name: string;
          allowed_tokens: string[];
          chain_id: string;
          permissions: string[];
        },
        signature: any;
      }
    }
    constructor(query: any, permit: any, chainId: string){
      this.with_permit = {
        query: query,
        permit: {
          params: {
            permit_name: permitName,
            allowed_tokens: allowedTokens,
            chain_id: chainId,
            permissions: permissions,
          },
          signature: permit,
        }
      }
    }
}

interface ErrorResponse {
    msg: string;
}

export interface QueryResponse {
    parse_err?: ErrorResponse;
    generic_err?: ErrorResponse;
}

export async function getQueryClient() {
    const client = new SecretNetworkClient({
        url: process.env.REACT_APP_GRPC_URL,
        chainId: process.env.REACT_APP_CHAIN_ID,
      });
    return client;
}
  
export async function ensureQueryClient() {
    if (!queryJs) queryJs = await getQueryClient();
}

const checkError = (queryResponse: any) => {
    if (typeof queryResponse === 'string' || queryResponse instanceof String)
      queryResponse = JSON.parse(queryResponse as string) as QueryResponse;
  
    if (queryResponse.parse_err || queryResponse.generic_err) { 
      console.error(queryResponse.parse_err || queryResponse.generic_err);
      if (queryResponse.parse_err) {
        throw new Error(queryResponse.parse_err.msg || queryResponse.parse_err);
      } else if (queryResponse.generic_err) {
        throw new Error(queryResponse.generic_err.msg || queryResponse.generic_err);
      } else {
        throw new Error(JSON.stringify(queryResponse));
      }
    }
};

export const queryWrapper = async (
    query: any,
    contract: string,
    hash: string,
    checkErrors = true,
  ): Promise<QueryResponse> => {
    try {
        await ensureQueryClient(); 
        let response = (await queryJs.query.compute.queryContract({
            contract_address: contract,
            code_hash: hash,
            query: query,
        })) as QueryResponse | string;

        console.log('Query:', JSON.stringify(query, undefined, 2));
        console.log('Response:', response);

        if (typeof response === 'string' || response instanceof String)
            response = JSON.parse(response as string) as QueryResponse;

        if (checkErrors) checkError(response);
        return response;
    } catch (error: any) {
        console.error(error);
        if (
            error.toString().includes('Network Error') ||
            error.toString().includes('503') ||
            error.toString().includes('Response closed without headers')
        ) {
            throw 'Failed to query network. The node may be experiencing issues.';
        } else {
            throw error;
        }
    }
};

export const queryOwnedTokens = async(address: string, permit: any) => {
    const query = {
        tokens: {
          owner: address,
          limit: 300
        }
    }
    const query2 = new PermitQuery(query, permit, chainId);

    const data = await queryWrapper(query2, process.env.REACT_APP_PACK_CONTRACT_ADDRESS, process.env.REACT_APP_PACK_CONTRACT_HASH) as Snip721GetTokensResponse
    return data.token_list.tokens;
}

export const queryTokenMetadata = async(id: string, permit: any) => {
  const query = {
      nft_dossier: {
        token_id: id
      }
  }

     const data = await queryWrapper(query, process.env.REACT_APP_PACK_CONTRACT_ADDRESS, process.env.REACT_APP_PACK_CONTRACT_HASH) as DossierResponse;
      let attributes = {};
      let unknown = "";
      if (data.nft_dossier.public_metadata.extension?.attributes?.length===1) unknown = "?"
      for (let i = 0; i < (data.nft_dossier.public_metadata.extension?.attributes ? data.nft_dossier.public_metadata.extension.attributes.length : 0); i++) {
          //@ts-ignore
          attributes[data.nft_dossier.public_metadata.extension.attributes[i].trait_type] = data.nft_dossier.public_metadata.extension.attributes[i].value + unknown;
        }
      return({
          nft_dossier: data.nft_dossier,
          pub_attributes: attributes
      });
  
}

export const queryStakedNfts = async(permit: any) => {
  const query = {
      get_user_staked_nfts: {
        permit:  {
          params: {
            permit_name: permitName,
            allowed_tokens: allowedTokens,
            chain_id: chainId,
            permissions: permissions,
          },
          signature: permit,
        }
      }
  } 
 
  const data = await queryWrapper(query, process.env.REACT_APP_QUEST_CONTRACT_ADDRESS, process.env.REACT_APP_QUEST_CONTRACT_HASH) as any;
  return data;
}

export const queryShillBalance = async(address: string, permit: any) => {
  const query = {
      balance: {
        address: address
      }
  }
  const query2 = new PermitQuery(query, permit, chainId);

  const data = await queryWrapper(query2, process.env.REACT_APP_SHILL_CONTRACT_ADDRESS, process.env.REACT_APP_SHILL_CONTRACT_HASH) as any
  return data;
}