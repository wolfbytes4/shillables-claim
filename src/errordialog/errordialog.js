import React, { Component } from "react";
import Button from "@mui/material/Button"; 
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog"; 
import "./errordialog.scss";

 
class ErrorDialog extends Component { 
   constructor(props) {
        super();
        this.state = { 
            imageName:''
        };
     
  }
  componentDidMount = () => { 
  };

  render() {   
    const p = this.props;
    const s = this.state;
    return (
      <Dialog onClose={p.handleErrorDialogClose} open={p.openErrorDialog} id="error-dialog" fullWidth="true"
      maxWidth="sm">
      <DialogTitle className="dialog-title">Oops Something Went Wrong!</DialogTitle>
      
      <div className="content"> 
        <img src={`/images/shillerror.png`} />
        <div className="error-box">{p.errorMessage}</div>
      </div> 

      <Button className="close-button" onClick={()=>p.handleErrorDialogClose()}>Close</Button>

    </Dialog>
    );
  }
 
}

export default ErrorDialog;