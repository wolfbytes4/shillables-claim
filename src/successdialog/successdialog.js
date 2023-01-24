import React, { Component } from "react";
import Button from "@mui/material/Button"; 
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog"; 
import "./successdialog.scss";

 
class SuccessDialog extends Component { 
   constructor(props) {
        super(); 
     
  }
  componentDidMount = () => { 
  };

  render() {   
    const p = this.props;
    const s = this.state;
    return (
      <Dialog onClose={p.handleSuccessDialogClose} open={p.openSuccessDialog} id="success-dialog" fullWidth="true"
      maxWidth="sm">
      <DialogTitle className="dialog-title">Congrats!!!</DialogTitle>
      
      <div className="content"> 
        <img src={`/images/shillsuccess.png`} />
        <div className="success-box">You've received your airdrop!!!</div>
      </div> 

      <Button className="close-button" onClick={()=>p.handleSuccessDialogClose()}>Close</Button>

    </Dialog>
    );
  }
 
}

export default SuccessDialog;