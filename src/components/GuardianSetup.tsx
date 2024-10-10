import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Box,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ConnectKitButton } from "connectkit";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { Button } from "./Button";
import InputField from "./InputField";
import Loader from "./Loader";
import { safeEmailRecoveryModule } from "../../contracts.base-sepolia.json";
import { safeAbi } from "../abi/Safe";
import { safeEmailRecoveryModuleAbi } from "../abi/SafeEmailRecoveryModule";
import { StepsContext } from "../App";
import infoIcon from "../assets/infoIcon.svg";
import { STEPS } from "../constants";
import { useAppContext } from "../context/AppContextHook";
import { config } from "../providers/config";
import { relayer } from "../services/relayer";
import { genAccountCode, templateIdx } from "../utils/email";
import { TIME_UNITS } from "../utils/recoveryDataUtils";

//logic for valid email address check for input
const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const GuardianSetup = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { guardianEmail, setGuardianEmail, accountCode, setAccountCode } =
    useAppContext();
  const stepsContext = useContext(StepsContext);

  const [isAccountInitializedLoading, setIsAccountInitializedLoading] =
    useState(false);
  const [loading, setLoading] = useState(false);
  // 0 = 2 week default delay, don't do for demo
  const [recoveryDelay, setRecoveryDelay] = useState(1);
  const recoveryExpiry = 7;
  const [emailError, setEmailError] = useState(false);
  const [recoveryDelayUnit, setRecoveryDelayUnit] = useState(
    TIME_UNITS.SECS.value
  );
  // const recoveryExpiryUnit = TIME_UNITS.DAYS.value;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetches the safe wallet owners. This will return an array of addresses for various owners.
  const { data: safeOwnersData } = useReadContract({
    address,
    abi: safeAbi,
    functionName: "getOwners",
  });

  const firstSafeOwner = useMemo(() => {
    const safeOwners = safeOwnersData as string[];
    if (!safeOwners?.length) {
      return;
    }
    return safeOwners[0];
  }, [safeOwnersData]);

  const checkIfRecoveryIsConfigured = useCallback(async () => {
    setIsAccountInitializedLoading(true);

    // Check if recovery is set up and activated. If so, proceed to the next step.
    // Note: In Safe 1.3, we can only verify if the acceptance request email has been replied to, not confirmed. The user must wait for this message before moving to the recovery step.

    const getGuardianConfig = await readContract(config, {
      abi: safeEmailRecoveryModuleAbi,
      address: safeEmailRecoveryModule as `0x${string}`,
      functionName: "getGuardianConfig",
      args: [address as `0x${string}`],
    });

    // Check whether recovery is configured
    if (
      getGuardianConfig.acceptedWeight === getGuardianConfig.threshold &&
      getGuardianConfig.threshold !== 0n
    ) {
      setLoading(false);
      stepsContext?.setStep(STEPS.WALLET_ACTIONS);
    }

    setIsAccountInitializedLoading(false);
  }, [address, stepsContext]);

  // Polling to check whether recovery is configured.
  useEffect(() => {
    checkIfRecoveryIsConfigured();

    // Clean up the interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkIfRecoveryIsConfigured]);

  //logic to check if email input is a valid email
  useEffect(() => {
    if (!guardianEmail) {
      setEmailError(false);
    } else if (!isValidEmail(guardianEmail)) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
  }, [guardianEmail]);

  const configureRecoveryAndRequestGuardian = useCallback(async () => {
    if (!address) {
      throw new Error("unable to get account address");
    }

    if (!guardianEmail) {
      throw new Error("guardian email not set");
    }

    if (!firstSafeOwner) {
      throw new Error("safe owner not found");
    }

    try {
      setLoading(true);
      toast(
        "Please check Safe Website to complete transaction and check your email later",
        {
          icon: <img src={infoIcon} />,
          style: {
            background: "white",
          },
        }
      );

      // The account code is unique for each account.
      const acctCode = await genAccountCode();
      localStorage.setItem("safe1_3AccountCode", acctCode);
      setAccountCode(accountCode);

      const guardianSalt = await relayer.getAccountSalt(
        acctCode,
        guardianEmail
      );

      // The guardian address is generated by sending the user's account address and guardian salt to the computeEmailAuthAddress function
      const guardianAddr = await readContract(config, {
        abi: safeEmailRecoveryModuleAbi,
        address: safeEmailRecoveryModule as `0x${string}`,
        functionName: "computeEmailAuthAddress",
        args: [address, guardianSalt],
      });

      // The configureSafeRecovery function takes recovery delay and expiry to set up the recovery process. Its units can be configured from the UI, but for this demo, we are hardcoding some values for ease of use.
      await writeContractAsync({
        abi: safeEmailRecoveryModuleAbi,
        address: safeEmailRecoveryModule as `0x${string}`,
        functionName: "configureSafeRecovery",
        args: [
          [guardianAddr],
          [1n],
          1n,
          BigInt(recoveryDelay * TIME_UNITS[recoveryDelayUnit].multiplier),
          BigInt(recoveryExpiry * 60 * 60 * 24 * 30),
        ],
      });

      // This function fetches the command template for the acceptanceRequest API call. The command template will be in the following format: [['Accept', "guardian", "request", "for", "{ethAddr}"]]
      const command = await readContract(config, {
        abi: safeEmailRecoveryModuleAbi,
        address: safeEmailRecoveryModule as `0x${string}`,
        functionName: "acceptanceCommandTemplates",
        args: [],
      });

      try {
        //   // Attempt the API call
        await relayer.acceptanceRequest(
          safeEmailRecoveryModule as `0x${string}`,
          guardianEmail,
          acctCode,
          templateIdx,
          command[0]
            .join()
            ?.replaceAll(",", " ")
            .replaceAll("{ethAddr}", address)
        );
      } catch (error) {
        // retry mechanism as this API call fails for the first time
        console.warn("502 error, retrying...");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
        await relayer.acceptanceRequest(
          safeEmailRecoveryModule as `0x${string}`,
          guardianEmail,
          acctCode,
          templateIdx,
          command[0]
            .join()
            ?.replaceAll(",", " ")
            .replaceAll("{ethAddr}", address)
        );
      }

      // Setting up interval for polling
      intervalRef.current = setInterval(() => {
        checkIfRecoveryIsConfigured();
      }, 5000); // Adjust the interval time (in milliseconds) as needed
    } catch (err) {
      console.log(err);
      toast.error(err.shortMessage);
      setLoading(false);
    }
  }, [
    address,
    guardianEmail,
    firstSafeOwner,
    setAccountCode,
    accountCode,
    writeContractAsync,
    recoveryDelay,
    recoveryDelayUnit,
    checkIfRecoveryIsConfigured,
  ]);

  if (isAccountInitializedLoading && !loading) {
    return <Loader />;
  }

  return (
    <Box sx={{ marginX: "auto", marginTop: "100px", marginBottom: "100px" }}>
      <Typography variant="h2" sx={{ paddingBottom: "1.5rem" }}>
        Set Up Guardian Details
      </Typography>
      <Typography variant="h6" sx={{ paddingBottom: "5rem" }}>
        Choose a Guardian you trust to be enable wallet recovery via email.
        They'll receive an email request.
      </Typography>

      <Grid
        container
        gap={3}
        justifyContent={"center"}
        sx={{
          maxWidth: { xs: "100%", lg: "60%" },
          width: "100%",
          marginX: "auto",
        }}
      >
        <Grid
          item
          container
          md={9}
          justifyContent={"space-around"}
          xs={12}
          sx={{ gap: 3 }}
        >
          <Grid item container>
            <Grid item container xs alignItems={"center"}>
              <Typography variant="body1">Guardian's Email</Typography>
              <Tooltip
                placement="top"
                title={
                  "Enter the email address of the guardian you want to set up for account recovery."
                }
                arrow
              >
                <IconButton
                  size="small"
                  aria-label="info"
                  sx={{ marginLeft: 1 }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item container xs={6} gap={2}>
              <TextField
                type="email"
                size="small"
                fullWidth
                value={guardianEmail}
                error={emailError}
                helperText={
                  emailError ? "Please enter the correct email address" : null
                }
                placeholder="guardian@prove.email"
                onChange={(e) => setGuardianEmail(e.target.value)}
                title="Guardian's Email"
              />
            </Grid>
          </Grid>
          <Grid
            item
            container
            direction={"row"}
            justifyContent={"space-between"}
            alignItems="center"
          >
            <Grid item container xs alignItems={"center"}>
              <Typography variant="body1">Timelock</Typography>
              <Tooltip
                placement="top"
                title={
                  "This is the duration during which guardians cannot initiate recovery. Recovery can only be triggered once this period has ended."
                }
                arrow
              >
                <IconButton
                  size="small"
                  aria-label="info"
                  sx={{ marginLeft: 1 }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item container xs={"auto"} gap={2}>
              <TextField
                type="number"
                size="small"
                sx={{ maxWidth: "6rem" }}
                value={recoveryDelay}
                onChange={(e) =>
                  setRecoveryDelay(
                    parseInt((e.target as HTMLInputElement).value)
                  )
                }
                title="Recovery Delay"
              />

              <Select
                value={recoveryDelayUnit}
                size="small"
                onChange={(e) => setRecoveryDelayUnit(e.target.value)}
              >
                {Object.keys(TIME_UNITS).map((timeUnit) => {
                  return (
                    <MenuItem value={TIME_UNITS[timeUnit].value}>
                      {TIME_UNITS[timeUnit].label}
                    </MenuItem>
                  );
                })}
              </Select>
            </Grid>
          </Grid>
          <Grid
            item
            container
            gap="1rem"
            justifyContent={"space-between"}
            alignItems={"center"}
          >
            <Typography variant="body1">Connected Wallet:</Typography>
            <ConnectKitButton />
          </Grid>
        </Grid>

        <Grid item sx={{ marginX: "auto" }}>
          <Box
            sx={{ width: "330px", marginX: "auto", marginTop: "30px" }}
          ></Box>
          <Button
            disabled={!guardianEmail || loading}
            loading={loading}
            onClick={configureRecoveryAndRequestGuardian}
            variant={"contained"}
          >
            Configure Recovery & Request Guardian
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GuardianSetup;
