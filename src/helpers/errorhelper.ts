import { TxResultCode, ArrayLog, TxResponse } from "secretjs";

export enum ComputeResultCode {
    // ErrInstantiateFailed error for rust instantiate contract failure
    ErrInstantiateFailed = 2, // "instantiate contract failed")
  
    // ErrExecuteFailed error for rust execution contract failure
    ErrExecuteFailed = 3, // "execute contract failed")
  
    // ErrQueryFailed error for rust smart query contract failure
    ErrQueryFailed = 4, // "query contract failed")
  
    // ErrMigrationFailed error for rust execution contract failure
    ErrMigrationFailed = 5, // "migrate contract failed")
  
    // ErrAccountExists error for a contract account that already exists
    ErrAccountExists = 6, // "contract account already exists")
  
    // ErrGasLimit error for out of gas
    ErrGasLimit = 7, // "insufficient gas")
  
    // ErrInvalidGenesis error for invalid genesis file syntax
    ErrInvalidGenesis = 8, // "invalid genesis")
  
    // ErrNotFound error for an entry not found in the store
    ErrNotFound = 9, // "not found")
  
    // ErrInvalidMsg error when we cannot process the error returned from the contract
    ErrInvalidMsg = 10, // "invalid CosmosMsg from the contract")
  
    // ErrEmpty error for empty content
    ErrEmpty = 11, // "empty")
  
    // ErrLimit error for content that exceeds a limit
    ErrLimit = 12, // "exceeds limit")
  
    // ErrInvalid error for content that is invalid in this context
    ErrInvalid = 13, // "invalid")
  
    // ErrDuplicate error for content that exsists
    ErrDuplicate = 14, // "duplicate")
  
    // ErrCreateFailed error for wasm code that has already been uploaded or failed
    ErrCreateFailed = 15, // "create contract failed")
  
    // ErrSigFailed error for wasm code that has already been uploaded or failed
    ErrSigFailed = 16, // "parse signature failed")
    /** Success is returned if the transaction executed successfuly */
    Success = 0,
  }
  
  export type ComputeTx = {
    readonly height: number;
    /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
    readonly transactionHash: string;
    /** Transaction execution error code. 0 on success. See {@link TxResultCode}. */
    readonly code: TxResultCode | ComputeResultCode;
    // /** Transaction execution error codespace. Empty or compute */
    // readonly codespace: string;
    /**
     * If code != 0, rawLog contains the error.
     *
     * If code = 0 you'll probably want to use `jsonLog` or `arrayLog`. Values are not decrypted.
     */
    readonly rawLog: string;
    /** If code = 0, `jsonLog = JSON.parse(rawLow)`. Values are decrypted if possible. */
    readonly jsonLog?: any;
    /** If code = 0, `arrayLog` is a flattened `jsonLog`. Values are decrypted if possible. */
    readonly arrayLog?: ArrayLog;
    /** Return value (if there's any) for each input message */
    readonly data: Array<Uint8Array>;
    /**
     * Decoded transaction input.
     */
    readonly tx: TxResponse;
    /**
     * Raw transaction bytes stored in Tendermint.
     *
     * If you hash this, you get the transaction hash (= transaction ID):
     *
     * ```js
     * import { sha256 } from "@noble/hashes/sha256";
     * import { toHex } from "@cosmjs/encoding";
     *
     * const transactionHash = toHex(sha256(indexTx.tx)).toUpperCase();
     * ```
     */
    readonly txBytes: Uint8Array;
    readonly gasUsed: number;
    readonly gasWanted: number;
  };
  

const parseComputeError = (tx: ComputeTx) => {
    if (!tx.code) return;

    const errorMsg = tx.jsonLog?.generic_err?.msg || tx.jsonLog?.parse_err?.msg || tx.rawLog;

    switch (tx.code) {
      case ComputeResultCode.ErrExecuteFailed:
        throw new Error(`Execute contract failed: ${errorMsg}`);

      // ErrQueryFailed error for rust smart query contract failure
      case ComputeResultCode.ErrQueryFailed:
        throw new Error(`Query contract failed: ${errorMsg}`);

      // ErrAccountExists error for a contract account that already exists
      case ComputeResultCode.ErrAccountExists:
        throw new Error(`Experienced account already exists error: ${errorMsg}`);

      // ErrGasLimit error for out of gas
      case ComputeResultCode.ErrGasLimit:
        throw new Error(`Exceeded gas limit.\nGas Limit: ${tx.gasWanted}\nGas Used: ${tx.gasUsed}`);

      // ErrNotFound error for an entry not found in the store
      case ComputeResultCode.ErrNotFound:
        throw new Error(`Contract not found: ${errorMsg}`);

      // ErrInvalidMsg error when we cannot process the error returned from the contract
      case ComputeResultCode.ErrInvalidMsg:
        throw new Error(`Experienced invalid message error: ${errorMsg}`);

      // ErrEmpty error for empty content
      case ComputeResultCode.ErrEmpty:
        throw new Error(`Empty Contract: ${errorMsg}`);

      // ErrLimit error for content that exceeds a limit
      case ComputeResultCode.ErrLimit:
        throw new Error(`Experienced Limit Exceeded error: ${errorMsg}`);

      // ErrInvalid error for content that is invalid in this context
      case ComputeResultCode.ErrInvalid:
        throw new Error(`Invalid context: ${errorMsg}`);

      // ErrDuplicate error for content that exsists
      case ComputeResultCode.ErrDuplicate:
        throw new Error(`Duplicate content: ${errorMsg}`);

      // ErrSigFailed error for wasm code that has already been uploaded or failed
      case ComputeResultCode.ErrSigFailed:
        throw new Error(`Experienced Sig Failed error: ${errorMsg}`);

      // case TxResultCode.ErrInsufficientFunds:
      //   //check if SCRT was sent
      //   if (tx.tx.body.messages.find((msg) => msg.value.sent_funds.length > 0)) {
      //     console.log('TX TODO Check this and make a better error', tx);
      //     throw new Error('Insufficent Funds');
      //   }

      //   // If not, only fees were trying to be paid
      //   throw new Error('Insufficent Funds for Transaction Fees');
    }
  };

export const parseTxError = (tx: ComputeTx) => {
    if (!tx.code) return;
    console.log('Failed TX', tx);
    console.error(tx.rawLog);
    if (/*tx.codespace === 'compute' || */ tx.rawLog.includes('contract')) parseComputeError(tx);
    else parseCosmosError(tx);
};

const parseCosmosError = (tx: ComputeTx) => {
    if (!tx.code) return;

    switch (tx.code) {
      /** ErrInternal should never be exposed, but we reserve this code for non-specified errors */
      case TxResultCode.ErrInternal:
        throw new Error('Node Internal Error Occured');

      /** ErrTxDecode is returned if we cannot parse a transaction */
      case TxResultCode.ErrTxDecode:
        throw new Error('Unable to Decode Transaction');

      /** ErrInvalidSequence is used the sequence number (nonce) is incorrect for the signature */
      case TxResultCode.ErrInvalidSequence:
        throw new Error(
          'Executed Out of Order. You may have a transaction pending or the system may be overloaded.',
        );

      /** ErrUnauthorized is used whenever a request without sufficient authorization is handled. */
      case TxResultCode.ErrUnauthorized:
        throw new Error('Transaction Unauthorized');

      /** ErrInsufficientFunds is used when the account cannot pay requested amount. */
      case TxResultCode.ErrInsufficientFunds:
         
        throw new Error('Insufficent Funds for Transaction Fees');

      /** ErrUnknownRequest to doc */
      case TxResultCode.ErrUnknownRequest:
        throw new Error(tx.rawLog);

      /** ErrInvalidAddress to doc */
      case TxResultCode.ErrInvalidAddress:
        throw new Error(tx.rawLog);

      /** ErrInvalidPubKey to doc */
      case TxResultCode.ErrInvalidPubKey:
        throw new Error(tx.rawLog);

      /** ErrUnknownAddress to doc */
      case TxResultCode.ErrUnknownAddress:
        throw new Error(tx.rawLog);

      /** ErrInvalidCoins to doc */
      case TxResultCode.ErrInvalidCoins:
        throw new Error(tx.rawLog);

      /** ErrOutOfGas to doc */
      case TxResultCode.ErrOutOfGas:
        throw new Error(`Exceeded gas limit.\nGas Limit: ${tx.gasWanted}\nGas Used: ${tx.gasUsed}`);

      /** ErrMemoTooLarge to doc */
      case TxResultCode.ErrMemoTooLarge:
        throw new Error('Memo too Long');

      /** ErrInsufficientFee to doc */
      case TxResultCode.ErrInsufficientFee:
        // const feeProvided = parseInt(tx.tx.authInfo.fee?.amount[0].amount || '0') / 10e5;
        throw new Error('Insufficent fees. Select a higher gas price.');

      /** ErrTooManySignatures to doc */
      case TxResultCode.ErrTooManySignatures:
        throw new Error(tx.rawLog);

      /** ErrNoSignatures to doc */
      case TxResultCode.ErrNoSignatures:
        throw new Error('Transaction was not signed');

      /** ErrJSONMarshal defines an ABCI typed JSON marshalling error */
      case TxResultCode.ErrJSONMarshal:
        throw new Error(tx.rawLog);

      /** ErrJSONUnmarshal defines an ABCI typed JSON unmarshalling error */
      case TxResultCode.ErrJSONUnmarshal:
        throw new Error(tx.rawLog);

      /** ErrInvalidRequest defines an ABCI typed error where the request contains invalid data. */
      case TxResultCode.ErrInvalidRequest:
        throw new Error(tx.rawLog);

      /** ErrTxInMempoolCache defines an ABCI typed error where a tx already exists in the mempool. */
      case TxResultCode.ErrTxInMempoolCache:
        throw new Error(tx.rawLog);

      /** ErrMempoolIsFull defines an ABCI typed error where the mempool is full. */
      case TxResultCode.ErrMempoolIsFull:
        throw new Error(tx.rawLog);

      /** ErrTxTooLarge defines an ABCI typed error where tx is too large. */
      case TxResultCode.ErrTxTooLarge:
        throw new Error(tx.rawLog);

      /** ErrKeyNotFound defines an error when the key doesn't exist */
      case TxResultCode.ErrKeyNotFound:
        throw new Error(tx.rawLog);

      /** ErrWrongPassword defines an error when the key password is invalid. */
      case TxResultCode.ErrWrongPassword:
        throw new Error(tx.rawLog);

      /** ErrorInvalidSigner defines an error when the tx intended signer does not match the given signer. */
      case TxResultCode.ErrorInvalidSigner:
        throw new Error(tx.rawLog);

      /** ErrorInvalidGasAdjustment defines an error for an invalid gas adjustment */
      case TxResultCode.ErrorInvalidGasAdjustment:
        throw new Error(tx.rawLog);

      /** ErrInvalidHeight defines an error for an invalid height */
      case TxResultCode.ErrInvalidHeight:
        throw new Error(tx.rawLog);

      /** ErrInvalidVersion defines a general error for an invalid version */
      case TxResultCode.ErrInvalidVersion:
        throw new Error(tx.rawLog);

      /** ErrInvalidChainID defines an error when the chain-id is invalid. */
      case TxResultCode.ErrInvalidChainID:
        throw new Error(tx.rawLog);

      /** ErrInvalidType defines an error an invalid type. */
      case TxResultCode.ErrInvalidType:
        throw new Error(tx.rawLog);

      /** ErrTxTimeoutHeight defines an error for when a tx is rejected out due to an explicitly set timeout height. */
      case TxResultCode.ErrTxTimeoutHeight:
        throw new Error(tx.rawLog);

      /** ErrUnknownExtensionOptions defines an error for unknown extension options. */
      case TxResultCode.ErrUnknownExtensionOptions:
        throw new Error(tx.rawLog);

      /** ErrWrongSequence defines an error where the account sequence defined in the signer info doesn't match the account's actual sequence number. */
      case TxResultCode.ErrWrongSequence:
        throw new Error(tx.rawLog);

      /** ErrPackAny defines an error when packing a protobuf message to Any fails. */
      case TxResultCode.ErrPackAny:
        throw new Error(tx.rawLog);

      /** ErrUnpackAny defines an error when unpacking a protobuf message from Any fails. */
      case TxResultCode.ErrUnpackAny:
        throw new Error(tx.rawLog);

      /** ErrLogic defines an internal logic error, e.g. an invariant or assertion that is violated. It is a programmer error, not a user-facing error. */
      case TxResultCode.ErrLogic:
        throw new Error(tx.rawLog);

      /** ErrConflict defines a conflict error, e.g. when two goroutines try to access the same resource and one of them fails. */
      case TxResultCode.ErrConflict:
        throw new Error(tx.rawLog);

      /** ErrNotSupported is returned when we call a branch of a code which is currently not supported. */
      case TxResultCode.ErrNotSupported:
        throw new Error(tx.rawLog);

      /** ErrNotFound defines an error when requested entity doesn't exist in the state. */
      case TxResultCode.ErrNotFound:
        throw new Error(tx.rawLog);

      /** ErrIO should be used to wrap internal errors caused by external operation. Examples: not DB domain error, file writing etc... */
      case TxResultCode.ErrIO:
        throw new Error(tx.rawLog);

      /** ErrAppConfig defines an error occurred if min-gas-prices field in BaseConfig is empty. */
      case TxResultCode.ErrAppConfig:
        throw new Error(tx.rawLog);

      /** ErrPanic is only set when we recover from a panic, so we know to redact potentially sensitive system info. */
      case TxResultCode.ErrPanic:
        throw new Error('Node Panicked');
    }
};