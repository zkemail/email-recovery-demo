import { Button } from "./Button";
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import walletIcon from "../assets/wallet.svg";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { useContext } from "react";
import { StepsContext } from "../App";
import { STEPS } from "../constants";
import { Typography, Box } from "@mui/material";

const ConnectWallets = () => {
  const { address } = useAccount();
  const stepsContext = useContext(StepsContext);

  if (address) {
    console.log(stepsContext, address, "inside useeffect");
    stepsContext?.setStep(STEPS.SAFE_MODULE_RECOVERY);
  }

  return (
    <div className="connect-wallets-container">

      <Box sx={{ marginX: 'auto', marginTop:'180px' }}>
      <Typography variant='h2' sx={{ paddingBottom: '20px'}}>Set Up Wallet Recovery</Typography>
      <Typography variant='h6' sx={{paddingBottom: '30px'}}>Connect your wallet now to make your wallet <br></br>recoverable by guardian.</Typography>
      {/* <Button endIcon={<img src={walletIcon} />}>Connect Genosis Safe</Button>

      <p color="#CECFD2" style={{ display: "flex", gap: "0.5rem" }}>
        <img src={infoIcon} alt="info" />
        Copy the link and import into your safe wallet
      </p> */}
      <ConnectKitButton.Custom>
        {({ show }) => {
          return (
            <Box width='200px' margin='auto'>
              <Button filled={true} onClick={show} endIcon={<AccountBalanceWalletOutlinedIcon/>}>
                Connect Safe
              </Button>
            </Box>

          );
        }}
      </ConnectKitButton.Custom>
      {/* <p style={{ textDecoration: "underline" }}>
        Or, recover existing wallet instead ➔
      </p> */}
      </Box>
    </div>
  );
};

export default ConnectWallets;
