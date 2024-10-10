import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { Box, Typography } from "@mui/material";
import { ConnectKitButton } from "connectkit";
import { useContext } from "react";
import { useAccount } from "wagmi";
import { Button } from "./Button";
import { StepsContext } from "../App";
import { STEPS } from "../constants";
import toast from "react-hot-toast";

const ConnectWallets = () => {
  const { address } = useAccount();
  const stepsContext = useContext(StepsContext);

  if (address) {
    // If we have the address, we can assume the user has successfully connected the safe wallet. Proceeding to the next step.
    stepsContext?.setStep(STEPS.SAFE_MODULE_RECOVERY);
  }

  return (
    <div className="connect-wallets-container">
      <Box sx={{ marginX: "auto", marginTop: "180px" }}>
        <Typography variant="h2" sx={{ paddingBottom: "20px" }}>
          Set Up Wallet Recovery
        </Typography>
        <Typography variant="h6" sx={{ paddingBottom: "30px" }}>
          Connect your wallet now to make your wallet <br></br>recoverable by
          guardian.
        </Typography>

        <ConnectKitButton.Custom>
          {({ show }) => {
            return (
              <Box width="200px" margin="auto">
                <Button
                  variant="contained"
                  onClick={() => {
                    toast("Please use WalletConnect to connect to the Safe account");
                    setTimeout(() => {
                      show();
                    }, 200);
                  }}
                  endIcon={<AccountBalanceWalletOutlinedIcon />}
                >
                  Connect Safe
                </Button>
              </Box>
            );
          }}
        </ConnectKitButton.Custom>
      </Box>
    </div>
  );
};

export default ConnectWallets;
