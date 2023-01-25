import React, { Component } from "react";
import "./App.css";
import shillLogo from "./assets/shill_logo.svg";
import shill from "./assets/shillbg.png";
import { MsgExecuteContract, SecretNetworkClient, Tx } from "secretjs";
import { parseTxError } from "./helpers/errorhelper.ts";
import { txWrapper } from "./helpers/txhelper.ts";
import {
  getKeplrViewingKey,
  setKeplrViewingKey,
  getWalletClient,
} from "./helpers/wallethelper.ts";
import { snapshot } from "./snapshot.ts";
import { bech32ToBytes } from "./helpers/bech32-to-bytes.ts";
import ErrorDialog from "./errordialog/errordialog";
import SuccessDialog from "./successdialog/successdialog";
import CircularProgress from '@mui/material/CircularProgress';

class App extends Component {
  constructor() {
    super();
    this.state = {
      address: "",
      viewingKey: "",
      shillAmount: null,
      claimMsg: null,
      isLoading: false,
      openErrorDialog: false,
      openSuccessDialog: false,
      errorMessage: null,
      claimCompleted: false
    };
  }

  getAddress = async () => {
    const chainID = process.env.REACT_APP_CHAIN_ID;
    const offlineSigner = window.getOfflineSigner(chainID);
    const accounts = await offlineSigner.getAccounts();
    console.log(accounts);
    const vk = await getKeplrViewingKey();
    this.setState({ address: accounts[0].address, viewingKey: vk });
  };


  handleVK = async () => {
    debugger;
    const s = this.state;
    if (!s.viewingKey) {
      const vk = await setKeplrViewingKey();
      this.setState({ viewingKey: vk });
      this.setClaimInfo();
    } else {
      this.setClaimInfo();
    }
  };
  setClaimInfo = () => {
    const s = this.state;
    const adressBytes = bech32ToBytes(s.address);

    try {
      var myIndex = snapshot.claims[adressBytes].index;
    } catch {
      alert("Your address is not in the snapshot!");
    }
    const shillAmount = parseInt(
      snapshot.claims[adressBytes].amount
    ).toString();
    const proof = snapshot.claims[adressBytes].proof.map((val) => val.slice(2));

    const claimMsg = {
      claim: {
        index: myIndex.toString(),
        address: s.address,
        amount: shillAmount,
        proof: proof,
      },
    };

    this.setState({ shillAmount: shillAmount, claimMsg: claimMsg });
  };

  claim = async () => {
    const s = this.state;
    debugger;
    if (s.claimMsg) { 
      this.setState({isLoading: true});
      const res = await txWrapper(
        s.claimMsg,
        process.env.REACT_APP_CLAIM_CONTRACT_ADDRESS,
        process.env.REACT_APP_CLAIM_CONTRACT_HASH,
        250_000,
        true,
        await getWalletClient()
      ).catch((err) => {
        this.setState({
          openErrorDialog: true,
          errorMessage: err.message,
          isLoading: false,
        });
      });

      if (res) { 
        this.setState({
          isLoading: false,
          openSuccessDialog: true, 
          isLoading: false,
          claimCompleted: true
        });
      }
    }
  };

  handleErrorDialogClose = () => {
    this.setState({ openErrorDialog: false });
  };

  handleSuccessDialogClose = () => {
    this.setState({ openSuccessDialog: false });
  };

  render() {
    const s = this.state;
    return (
      <div className="App">
        <div className="top-half">
          <div className="logo">
            <img src={shillLogo} />
          </div>
          <div>
            <img src='./images/shillsuccess.png' className="shillionaire" />
          </div>
          <div className="shill-sub-txt">
            SO YOU WANT TO BE A SHILLIONAIRE?
          </div>
        </div>
        <div className="steps">
          <div className="step-one">
            <div className="step-text">STEP 1: Connect Wallet</div>

            {!s.address && (
              <button
                class="button-85"
                role="button"
                onClick={(e) => this.getAddress()}
              >
                CONNECT
              </button>
            )}
            {s.address && (
              <button class="button-85-no-animation" role="button">
                <div className="col connect-col">
                  {s.address.substring(0, 8) +
                    "...." +
                    s.address.substring(s.address.length - 8, s.address.length)}
                </div>
              </button>
            )}
          </div>
          <div className="step-one">
            <div className="step-text">STEP 2: Create Viewing Key</div>

            {!s.shillAmount && (
              <button
                class="button-85"
                role="button"
                onClick={() => this.handleVK()}
              >
                CREATE VK
              </button>
            )}
            {s.shillAmount && (
              <button class="button-85-no-animation" role="button">
                {s.shillAmount.slice(0, -6)} $SHILL
              </button>
            )}
          </div>
          <div className="step-one">
            <div className="step-text">STEP 3: Claim</div>
            

            {!s.claimCompleted && (
              <button
              class="button-85"
              role="button"
              onClick={() => this.claim()}
              >
                CLAIM {s.isLoading && (<CircularProgress className="loading" color="success" />)}
              </button>
            )}
            {s.claimCompleted && (
              <button class="button-85-no-animation" role="button">
                Claim Completed
              </button>
            )}
          </div>
        </div>
        {s.openErrorDialog && (
          <ErrorDialog
            openErrorDialog={s.openErrorDialog}
            handleErrorDialogClose={this.handleErrorDialogClose}
            errorMessage={s.errorMessage}
          />
        )}
        {s.openSuccessDialog && (
          <SuccessDialog
            openSuccessDialog={s.openSuccessDialog}
            handleSuccessDialogClose={this.handleSuccessDialogClose} 
          />
        )}
      </div>
    );
  }
}

export default App;
