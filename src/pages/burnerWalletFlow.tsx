import { useContext, useEffect, useState } from "react";
import { StepsContext } from "../App";
import GuardianSetup from "../components/burnerWallet/GuardianSetup";
import RequestedRecoveries from "../components/burnerWallet/RequestedRecoveries";
import { STEPS } from "../constants";
import { Button } from "../components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const BurnerWalletFlow = () => {
  const stepsContext = useContext(StepsContext);
  const [burnerWalletAddress, setBurnerWalletAddress] = useState<
    string | null
  >();
  const [
    isResetBurnerWalletConfirmationModalOpen,
    setIsResetBurnerWalletConfirmationModalOpen,
  ] = useState(false);

  useEffect(() => {
    if (!burnerWalletAddress) {
      const burnerWalletAddressPollingInterval = setInterval(() => {
        const burnerWalletConfig = localStorage.getItem("burnerWalletConfig");
        if (burnerWalletConfig !== undefined && burnerWalletConfig !== null) {
          setBurnerWalletAddress(
            JSON.parse(burnerWalletConfig)?.burnerWalletAddress,
          );
          clearInterval(burnerWalletAddressPollingInterval);
        }
      }, 1000);
    }
  }, [burnerWalletAddress]);

  const renderBody = () => {
    switch (stepsContext?.step) {
      // Step to create a new safe and install the universal email recovery module. This step requires guardian emails before the recovery module can be installed
      case STEPS.REQUEST_GUARDIAN:
        return <GuardianSetup />;

      // Step to add the new owner's address and trigger/complete the recovery process. This flow is similar to Safe v1.3
      case STEPS.REQUESTED_RECOVERIES:
        return <RequestedRecoveries />;

      default:
        return <GuardianSetup />;
    }
  };

  return (
    <div className="app">
      {burnerWalletAddress ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "4px",
          }}
        >
          Burner Wallet Address:{" "}
          <a
            href={`https://app.safe.global/home?safe=basesep%3A${burnerWalletAddress}`}
            target="_blank"
          >
            {burnerWalletAddress}
          </a>
          <IconButton
            onClick={async () => {
              setIsResetBurnerWalletConfirmationModalOpen(true);
            }}
          >
            <RestartAltIcon />
          </IconButton>
        </div>
      ) : null}
      <Dialog
        open={isResetBurnerWalletConfirmationModalOpen}
        keepMounted
        onClose={setIsResetBurnerWalletConfirmationModalOpen}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>{"Reset Burner Wallet"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            Are you certain you want to reset the burner wallet? Clicking
            "Reset" will permanently remove the burner wallet address from the
            website, and you won't be able to access it again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsResetBurnerWalletConfirmationModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setIsResetBurnerWalletConfirmationModalOpen(false); // Remove these values from localStorage to prevent conflicts with the safe wallet flow.
              await localStorage.removeItem("accountCode");
              await localStorage.removeItem("burnerWalletConfig");
              window.location.reload();
              setBurnerWalletAddress(null);
            }}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      {renderBody()}
    </div>
  );
};

export default BurnerWalletFlow;
