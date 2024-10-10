import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { Box, Grid, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { encodeAbiParameters, encodeFunctionData } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { Button } from "./Button";
import ConnectedWalletCard from "./ConnectedWalletCard";
import InputField from "./InputField";
import Loader from "./Loader";
import { safeEmailRecoveryModule } from "../../contracts.base-sepolia.json";
import { safeAbi } from "../abi/Safe";
import { safeEmailRecoveryModuleAbi } from "../abi/SafeEmailRecoveryModule";
import cancelRecoveryIcon from "../assets/cancelRecoveryIcon.svg";
import completeRecoveryIcon from "../assets/completeRecoveryIcon.svg";
import infoIcon from "../assets/infoIcon.svg";
import { useAppContext } from "../context/AppContextHook";

import { config } from "../providers/config";
import { relayer } from "../services/relayer";
import { templateIdx } from "../utils/email";

const BUTTON_STATES = {
  TRIGGER_RECOVERY: "Trigger Recovery",
  CANCEL_RECOVERY: "Cancel Recovery",
  COMPLETE_RECOVERY: "Complete Recovery",
  RECOVERY_COMPLETED: "Recovery Completed",
};

const RequestedRecoveries = () => {
  // const theme = useTheme(); for some reason this was causing trigger recovery button to be skipped??
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { guardianEmail } = useAppContext();
  const navigate = useNavigate();

  const [newOwner, setNewOwner] = useState<string>();
  const safeWalletAddress = address;
  const [guardianEmailAddress, setGuardianEmailAddress] =
    useState(guardianEmail);
  const [buttonState, setButtonState] = useState(
    BUTTON_STATES.TRIGGER_RECOVERY
  );

  const [isTriggerRecoveryLoading, setIsTriggerRecoveryLoading] =
    useState<boolean>(false);
  const [isCompleteRecoveryLoading, setIsCompleteRecoveryLoading] =
    useState<boolean>(false);
  const [isCancelRecoveryLoading, setIsCancelRecoveryLoading] =
    useState<boolean>(false);
  const [isRecoveryStatusLoading, setIsRecoveryStatusLoading] = useState(false);
  console.log(isRecoveryStatusLoading);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Checks whether recovery has been triggered.
  const checkIfRecoveryCanBeCompleted = useCallback(async () => {
    if (!address) return;
    setIsRecoveryStatusLoading(true);
    const getRecoveryRequest = await readContract(config, {
      abi: safeEmailRecoveryModuleAbi,
      address: safeEmailRecoveryModule as `0x${string}`,
      functionName: "getRecoveryRequest",
      args: [address as `0x${string}`],
    });

    const getGuardianConfig = await readContract(config, {
      abi: safeEmailRecoveryModuleAbi,
      address: safeEmailRecoveryModule as `0x${string}`,
      functionName: "getGuardianConfig",
      args: [address as `0x${string}`],
    });

    console.log(getGuardianConfig, getRecoveryRequest);

    // Update the button state based on the condition. The current weight represents the number of users who have confirmed the email, and the threshold indicates the number of confirmations required before the complete recovery can be called
    if (getRecoveryRequest.currentWeight < getGuardianConfig.threshold) {
      setButtonState(BUTTON_STATES.TRIGGER_RECOVERY);
    } else {
      setButtonState(BUTTON_STATES.COMPLETE_RECOVERY);
      clearInterval(intervalRef.current);
    }
    setIsRecoveryStatusLoading(false);
  }, [address, intervalRef]);

  useEffect(() => {
    checkIfRecoveryCanBeCompleted();
  }, [checkIfRecoveryCanBeCompleted]);

  const { data: safeOwnersData } = useReadContract({
    address,
    abi: safeAbi,
    functionName: "getOwners",
  });

  const requestRecovery = useCallback(async () => {
    setIsTriggerRecoveryLoading(true);
    toast("Please check your email and reply to the email", {
      icon: <img src={infoIcon} />,
      style: {
        background: "white",
      },
    });
    if (!safeWalletAddress) {
      throw new Error("unable to get account address");
    }

    if (!guardianEmailAddress) {
      throw new Error("guardian email not set");
    }

    if (!newOwner) {
      throw new Error("new owner not set");
    }

    if (!safeOwnersData[0]) {
      toast.error(
        "Could not find safe owner. Please check if safe is configured correctly."
      );
    }

    // This function fetches the command template for the recoveryRequest API call. The command template will be in the following format: ["Recover", "account", "{ethAddr}", "from", "old", "owner", "{ethAddr}", "to", "new", "owner", "{ethAddr}"]
    const command = await readContract(config, {
      abi: safeEmailRecoveryModuleAbi,
      address: safeEmailRecoveryModule as `0x${string}`,
      functionName: "recoveryCommandTemplates",
      args: [],
    });

    try {
      // requestId
      await relayer.recoveryRequest(
        safeEmailRecoveryModule as string,
        guardianEmailAddress,
        templateIdx,
        command[0]
          .join()
          ?.replaceAll(",", " ")
          .replace("{ethAddr}", safeWalletAddress)
          .replace("{ethAddr}", safeOwnersData[0])
          .replace("{ethAddr}", newOwner)
      );

      intervalRef.current = setInterval(() => {
        checkIfRecoveryCanBeCompleted();
      }, 5000); // Adjust the interval time (in milliseconds) as needed
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong while requesting recovery");
      setIsTriggerRecoveryLoading(false);
    }
  }, [
    safeWalletAddress,
    guardianEmailAddress,
    newOwner,
    checkIfRecoveryCanBeCompleted,
    safeOwnersData,
  ]);

  const completeRecovery = useCallback(async () => {
    setIsCompleteRecoveryLoading(true);

    const swapOwnerCallData = encodeFunctionData({
      abi: safeAbi,
      functionName: "swapOwner",
      args: [
        "0x0000000000000000000000000000000000000001", // If there is no previous owner of the safe, then the default value will be this
        safeOwnersData[0],
        newOwner,
      ],
    });
    const completeCalldata = encodeAbiParameters(
      [{ type: "address" }, { type: "bytes" }],
      [safeWalletAddress, swapOwnerCallData]
    );

    try {
      // Make the completeRecovery API call
      const res = await relayer.completeRecovery(
        safeEmailRecoveryModule as string,
        safeWalletAddress as string,
        completeCalldata
      );

      console.debug("complete recovery data", res);
      setButtonState(BUTTON_STATES.RECOVERY_COMPLETED);
    } catch (err) {
      toast.error("Something went wrong while completing recovery process");
    } finally {
      setIsCompleteRecoveryLoading(false);
    }
  }, [newOwner, safeOwnersData, safeWalletAddress]);

  const handleCancelRecovery = useCallback(async () => {
    toast("Please execute transaction at Safe website");
    setIsCancelRecoveryLoading(true);
    setIsTriggerRecoveryLoading(false);
    try {
      await writeContractAsync({
        abi: safeEmailRecoveryModuleAbi,
        address: safeEmailRecoveryModule as `0x${string}`,
        functionName: "cancelRecovery",
        args: [],
      });

      console.log("Recovery Cancelled");
      toast.success("Recovery Cancelled");
      setButtonState(BUTTON_STATES.TRIGGER_RECOVERY);
    } catch (err) {
      toast.error("Something went wrong while cancelling recovery process");
    } finally {
      setIsCancelRecoveryLoading(false);
    }
  }, [newOwner, safeOwnersData, safeWalletAddress]);

  const getButtonComponent = () => {
    // Renders the appropriate buttons based on the button state.
    switch (buttonState) {
      case BUTTON_STATES.TRIGGER_RECOVERY:
        return (
          <Button
            loading={isTriggerRecoveryLoading}
            variant="contained"
            onClick={requestRecovery}
            disabled={
              safeOwnersData?.includes(newOwner) ||
              !newOwner ||
              !guardianEmailAddress ||
              !address
            }
          >
            {isTriggerRecoveryLoading
              ? "Waiting for Email Confirmation"
              : "Trigger Recovery"}
          </Button>
        );
      case BUTTON_STATES.COMPLETE_RECOVERY:
        return (
          <Button
            loading={isCompleteRecoveryLoading}
            variant="contained"
            onClick={completeRecovery}
            endIcon={<img src={completeRecoveryIcon} />}
          >
            Complete Recovery
          </Button>
        );
      case BUTTON_STATES.RECOVERY_COMPLETED:
        return (
          <Button variant={"contained"} onClick={() => navigate("/")}>
            Complete! Connect new wallet to set new guardians ➔
          </Button>
        );
    }
  };

  // Since we are polling for every actions but only wants to show full screen loader for the initial request
  if (
    isRecoveryStatusLoading &&
    !isTriggerRecoveryLoading &&
    !isCompleteRecoveryLoading &&
    !isCancelRecoveryLoading
  ) {
    return <Loader />;
  }

  return (
    <Box
      sx={{
        marginX: "auto",
        marginTop: { xs: "2rem", sm: "9.375rem" },
        marginBottom: "6.25rem",
        maxWidth: { xs: "100%", md: "80%", lg: "50%" },
      }}
    >
      <Grid item xs={12} textAlign={"start"}>
        <Button
          variant="text"
          onClick={() => {
            navigate("/");
          }}
          sx={{ textAlign: "left", cursor: "pointer", width: "auto" }}
        >
          ← Back
        </Button>
      </Grid>
      {buttonState === BUTTON_STATES.RECOVERY_COMPLETED ? (
        <>
          <Typography variant="h2" sx={{ paddingBottom: "1.25rem" }}>
            Completed Wallet Transfer!
          </Typography>
          <Typography variant="h6" sx={{ paddingBottom: "3.125rem" }}>
            Great job your old wallet has successfully transferred ownership
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="h2" sx={{ paddingBottom: "1.25rem" }}>
            Recover Your Wallet
          </Typography>
          <Typography variant="h6" sx={{ paddingBottom: "3.125rem" }}>
            Enter your guardian email address and the new wallet you want to
            transfer to
          </Typography>
        </>
      )}
      <div
        style={{
          margin: "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            {buttonState === BUTTON_STATES.RECOVERY_COMPLETED ? (
              <Box
                width="100%"
                height="100px"
                alignContent="center"
                justifyItems="center"
                borderRadius={3}
                sx={{
                  position: "relative",
                }}
              >
                <ConnectedWalletCard address={address} />
                <div
                  style={{
                    display: "flex",
                    background: "#E7FDED",
                    border: "1px solid #6DD88B",
                    color: "#0A6825",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "26px",
                    width: "fit-content",
                    height: "18px",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "absolute",
                    top: "-10px",
                    right: "-12px",
                  }}
                >
                  <Typography
                    sx={{
                      marginLeft: "0.5rem",
                      fontSize: "12px",
                      color: "#0A6825",
                    }}
                  >
                    Recovered
                  </Typography>
                  <MonetizationOnIcon
                    sx={{ padding: "6px", fontSize: "12px" }}
                  />
                </div>
              </Box>
            ) : (
              <ConnectedWalletCard address={address} />
            )}
          </div>
        </div>
        {buttonState === BUTTON_STATES.RECOVERY_COMPLETED ? null : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              width: "100%",
              textAlign: "left",
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>
              Requested Recoveries:
            </Typography>
            <Grid container gap={3} justifyContent={"space-around"}>
              <Grid item xs={12} sm={5.5}>
                <InputField
                  type="email"
                  placeholderText="test@gmail.com"
                  value={guardianEmailAddress}
                  tooltipTitle="Enter the email address of the guardian you used for account recovery"
                  onChange={(e) => setGuardianEmailAddress(e.target.value)}
                  locked={guardianEmail ? true : false}
                  label="Guardian's Email"
                />
              </Grid>
              <Grid item xs={12} sm={5.5}>
                <InputField
                  type="string"
                  status={
                    newOwner
                      ? safeOwnersData?.includes(newOwner)
                        ? "error"
                        : "okay"
                      : null
                  }
                  statusNote={
                    newOwner
                      ? safeOwnersData?.includes(newOwner)
                        ? "The new owner's address cannot be the same as the old owner's"
                        : "Okay"
                      : null
                  }
                  placeholderText="0xAB12..."
                  value={newOwner || ""}
                  onChange={(e) => setNewOwner(e.target.value)}
                  label="Requested New Owner Address"
                  tooltipTitle="Enter the wallet address of the new owner of this safe account"
                />
              </Grid>
            </Grid>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            margin: "auto",
          }}
        >
          {buttonState === BUTTON_STATES.COMPLETE_RECOVERY ? (
            <div style={{ minWidth: "300px" }}>
              <Button
                onClick={() => handleCancelRecovery()}
                endIcon={<img src={cancelRecoveryIcon} />}
                loading={isCancelRecoveryLoading}
                variant="outlined"
              >
                Cancel Recovery
              </Button>
            </div>
          ) : null}
          <div style={{ minWidth: "300px" }}>{getButtonComponent()}</div>
        </div>
      </div>
    </Box>
  );
};

export default RequestedRecoveries;
