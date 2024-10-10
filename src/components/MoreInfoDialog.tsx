import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from "@mui/material";
import React, { useState } from "react";

interface MoreInfoDialogProps {
  title: string;
  message: string;
}

const MoreInfoDialog: React.FC<MoreInfoDialogProps> = ({ title, message }) => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <IconButton
        onClick={handleClickOpen}
        sx={{ color: "#207CE9", "&:focus": { outline: "none" } }}
      >
        <InfoOutlinedIcon />
      </IconButton>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ color: "#FD4BA1" }}>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontWeight: 100 }}>
            {message}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MoreInfoDialog;
