import { Button } from "./Button";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { safeEmailRecoveryModule } from "../../contracts.base-sepolia.json";
import { safeAbi } from "../abi/Safe";
import { useCallback, useContext, useState } from "react";
import { StepsContext } from "../App";
import { STEPS } from "../constants";
import Loader from "./Loader";
import infoIcon from "../assets/infoIcon.svg";
import toast from "react-hot-toast";
import { Box, Typography } from "@mui/material";
import ConnectedWalletCard from "./ConnectedWalletCard";

const EnableSafeModule = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const stepsContext = useContext(StepsContext);
  const [isEnableModalLoading, setIsEnableModuleLoading] = useState(false);

  const { data: isModuleEnabled, isLoading: isCheckModuleEnabledLoading } =
    useReadContract({
      address,
      abi: safeAbi,
      functionName: "isModuleEnabled",
      args: [safeEmailRecoveryModule],
    });

  if (isModuleEnabled) {
    setIsEnableModuleLoading(false);
    stepsContext?.setStep(STEPS.REQUEST_GUARDIAN);
  }

  const enableEmailRecoveryModule = useCallback(async () => {
    setIsEnableModuleLoading(true);
    if (!address) {
      throw new Error("unable to get account address");
    }

    toast("Please check Safe Website to complete transaction", {
      icon: <img src={infoIcon} />,
      style: {
        background: "white",
      },
    });

    await writeContractAsync({
      abi: safeAbi,
      address,
      functionName: "enableModule",
      args: [safeEmailRecoveryModule],
    });
  }, [address, writeContractAsync]);

  if (isCheckModuleEnabledLoading) {
    return <Loader />;
  }

  return (
    <Box sx={{ marginX: "auto", marginTop: { xs: "2rem", sm: "9.375rem" } }}>
      <Typography variant="h2" sx={{ paddingBottom: "10px" }}>
        Set Up Wallet Recovery
      </Typography>
      <Typography variant="h6" sx={{ paddingBottom: "40px" }}>
        Connect your wallet now to make your wallet
        <br />
        recoverable by guardian.
      </Typography>
      <div style={{ display: "flex", gap: "2rem", flexDirection: "column" }}>
        <ConnectedWalletCard address={address} />
        {!isModuleEnabled ? (
          <Box sx={{ marginX: "auto", width: "18.75rem" }}>
            <Button
              filled={true}
              disabled={isEnableModalLoading}
              loading={isEnableModalLoading}
              onClick={enableEmailRecoveryModule}
            >
              Enable Email Recovery Module
            </Button>
          </Box>
        ) : null}
      </div>
    </Box>
  );
};

export default EnableSafeModule;
