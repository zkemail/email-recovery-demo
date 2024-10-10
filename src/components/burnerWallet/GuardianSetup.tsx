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
import {
  createSmartAccountClient,
  ENTRYPOINT_ADDRESS_V07,
  walletClientToSmartAccountSigner,
} from "permissionless";
import { signerToSafeSmartAccount } from "permissionless/accounts";
import { erc7579Actions } from "permissionless/actions/erc7579";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { createWalletClient, custom, http, WalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { readContract } from "wagmi/actions";
import { pimlicoBundlerClient, publicClient, run } from "./deploy";
import {
  erc7569LaunchpadAddress,
  safe4337ModuleAddress,
  universalEmailRecoveryModule,
  validatorsAddress,
} from "../../../contracts.base-sepolia.json";
import { abi as universalEmailRecoveryModuleAbi } from "../../abi/UniversalEmailRecoveryModule.json";
import { StepsContext } from "../../App";
import infoIcon from "../../assets/infoIcon.svg";
import { STEPS } from "../../constants";
import { useAppContext } from "../../context/AppContextHook";
import { useBurnerAccount } from "../../context/BurnerAccountContext";
import { config } from "../../providers/config";
import { relayer } from "../../services/relayer";
import { genAccountCode, templateIdx } from "../../utils/email";
import { TIME_UNITS } from "../../utils/recoveryDataUtils";
import { useGetSafeAccountAddress } from "../../utils/useGetSafeAccountAddress";
import { Button } from "../Button";
import InputField from "../InputField";
import Loader from "../Loader";

//logic for valid email address check for input
const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const GuardianSetup = () => {
  const address = useGetSafeAccountAddress();
  const { setBurnerAccountClient } = useBurnerAccount();

  const { guardianEmail, setGuardianEmail, accountCode, setAccountCode } =
    useAppContext();
  const stepsContext = useContext(StepsContext);

  const [isAccountInitializedLoading, setIsAccountInitializedLoading] =
    useState(false);
  console.log(isAccountInitializedLoading);
  const [loading, setLoading] = useState(false);

  // 0 = 2 week default delay, don't do for demo
  const [recoveryDelay, setRecoveryDelay] = useState(1);
  const [isWalletPresent, setIsWalletPresent] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [recoveryDelayUnit, setRecoveryDelayUnit] = useState(
    TIME_UNITS.SECS.value
  );
  // const [recoveryExpiryUnit, setRecoveryExpiryUnit] = useState(
  //   TIME_UNITS.DAYS.value,
  // );
  const [isBurnerWalletCreating, setIsBurnerWalletCreating] = useState(false);

  // A new account code must be created for each session to enable the creation of a new wallet, and it will be used throughout the demo flow

  const initialSaltNonce = BigInt(
    localStorage.getItem("saltNonce") || Math.floor(Math.random() * 100000)
  );
  const [saltNonce, setSaltNonce] = useState<bigint>(initialSaltNonce);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkIfRecoveryIsConfigured = useCallback(async () => {
    let burnerWalletAddress;
    const burnerWalletConfig = localStorage.getItem("burnerWalletConfig");

    if (burnerWalletConfig) {
      burnerWalletAddress = JSON.parse(burnerWalletConfig).burnerWalletAddress;
    }

    if (!burnerWalletAddress) {
      return;
    }

    setIsAccountInitializedLoading(true);
    const getGuardianConfig = await readContract(config, {
      abi: universalEmailRecoveryModuleAbi,
      address: universalEmailRecoveryModule as `0x${string}`,
      functionName: "getGuardianConfig",
      args: [burnerWalletAddress],
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
  }, [stepsContext]);

  const connectWallet = async () => {
    setIsBurnerWalletCreating(true);

    // Assuming install function sets the account
    const addresses = await window.ethereum.request({
      method: "eth_requestAccounts",
    }); // Cast the result to string[]
    const [address] = addresses;

    try {
      // Creating new wallet client
      const client: WalletClient = createWalletClient({
        account: address, // Type assertion to match the expected format
        chain: baseSepolia,
        transport: custom(window.ethereum),
      });

      // This will create a new safe account
      const safeAccount = await signerToSafeSmartAccount(publicClient, {
        signer: walletClientToSmartAccountSigner(client),
        safeVersion: "1.4.1",
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        saltNonce: saltNonce,
        safe4337ModuleAddress: safe4337ModuleAddress as `0x${string}`,
        erc7569LaunchpadAddress: erc7569LaunchpadAddress as `0x${string}`,
        validators: [
          {
            address: validatorsAddress as `0x${string}`,
            context: "0x",
          },
        ],
      });

      // Updating this for the new burner wallet flow. We want to create a new burner account, which can be achieved by changing the nonce, as all other parameters remain the same.
      const newSaltNonce = saltNonce + 1n;
      setSaltNonce(newSaltNonce);
      localStorage.setItem("saltNonce", newSaltNonce.toString());

      const acctCode = await genAccountCode();

      await localStorage.setItem("accountCode", acctCode);
      await setAccountCode(accountCode);

      const guardianSalt = await relayer.getAccountSalt(
        acctCode,
        guardianEmail
      );

      // The guardian address is generated by sending the user's account address and guardian salt to the computeEmailAuthAddress function
      const guardianAddr = (await readContract(config, {
        abi: universalEmailRecoveryModuleAbi,
        address: universalEmailRecoveryModule as `0x${string}`,
        functionName: "computeEmailAuthAddress",
        args: [safeAccount.address, guardianSalt],
      })) as string;

      const smartAccountClient = createSmartAccountClient({
        account: safeAccount,
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        chain: baseSepolia,
        bundlerTransport: http(
          `https://api.pimlico.io/v2/base-sepolia/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`
        ),
        middleware: {
          gasPrice: async () =>
            (await pimlicoBundlerClient.getUserOperationGasPrice()).fast, // if using pimlico bundler
        },
      }).extend(erc7579Actions({ entryPoint: ENTRYPOINT_ADDRESS_V07 }));

      console.log(safeAccount, smartAccountClient);

      await localStorage.setItem("safeAccount", JSON.stringify(safeAccount));
      localStorage.setItem(
        "smartAccountClient",
        JSON.stringify(smartAccountClient)
      );

      setBurnerAccountClient(smartAccountClient);

      // The run function creates a new burner wallet, assigns the current owner as its guardian, installs the recovery module, and returns the wallet's address.
      const burnerWalletAddress = await run(
        client,
        safeAccount,
        smartAccountClient,
        guardianAddr
      );
      await localStorage.setItem(
        "burnerWalletConfig",
        JSON.stringify({ burnerWalletAddress })
      );
      setIsWalletPresent(true);
    } catch (error) {
      console.log(error);
      toast.error(`Something went wrong. Err: ${error.shortMessage}`);
    } finally {
      setIsBurnerWalletCreating(false);
    }
  };

  useEffect(() => {
    checkIfRecoveryIsConfigured();

    // Since we are storing the burner wallet's address in localStorage, this check will help us determine if the user is creating a new wallet or has just refreshed the page
    const burnerWalletConfig = localStorage.getItem("burnerWalletConfig");
    if (burnerWalletConfig && burnerWalletConfig != undefined) {
      setIsWalletPresent(true);
    }

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
    try {
      if (!guardianEmail) {
        throw new Error("guardian email not set");
      }

      const localStorageAccountCode = localStorage.getItem("accountCode");
      let burnerWalletAddress;

      const burnerWalletConfig = localStorage.getItem("burnerWalletConfig");

      if (burnerWalletConfig) {
        burnerWalletAddress =
          JSON.parse(burnerWalletConfig).burnerWalletAddress;
      }

      if (!localStorageAccountCode) {
        toast.error("Seomthing went wrong, please restart the flow");
        console.error("Invalid account code");
      }

      setLoading(true);
      toast("Please check your email", {
        icon: <img src={infoIcon} />,
        style: {
          background: "white",
        },
      });

      // This function fetches the command template for the acceptanceRequest API call. The command template will be in the following format: [['Accept', "guardian", "request", "for", "{ethAddr}"]]
      const subject = await readContract(config, {
        abi: universalEmailRecoveryModuleAbi,
        address: universalEmailRecoveryModule as `0x${string}`,
        functionName: "acceptanceCommandTemplates",
        args: [],
      });

      try {
        // Attempt the API call
        await relayer.acceptanceRequest(
          universalEmailRecoveryModule as `0x${string}`,
          guardianEmail,
          localStorageAccountCode,
          templateIdx,
          subject[0]
            .join()
            .replaceAll(",", " ")
            .replace("{ethAddr}", burnerWalletAddress)
        );
      } catch (error) {
        // retry mechanism as this API call fails for the first time
        console.warn("502 error, retrying...");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
        await relayer.acceptanceRequest(
          universalEmailRecoveryModule as `0x${string}`,
          guardianEmail,
          localStorageAccountCode,
          templateIdx,
          subject[0]
            .join()
            .replaceAll(",", " ")
            .replace("{ethAddr}", burnerWalletAddress)
        );
      }

      // Setting up interval for polling
      intervalRef.current = setInterval(() => {
        checkIfRecoveryIsConfigured();
      }, 5000); // Adjust the interval time (in milliseconds) as needed
    } catch (err) {
      console.error(err);
      toast.error(
        err?.shortMessage ?? "Something went wrong, please try again."
      );
      setLoading(false);
    }
  }, [address, guardianEmail, checkIfRecoveryIsConfigured]);

  if (isAccountInitializedLoading && !loading && !isBurnerWalletCreating) {
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
                // helperText="This is the delay you the actual wallet owner has to cancel recovery after recovery has been initiated, helpful for preventing malicious behavior from guardians."
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
        </Grid>

        {/* <InputField
              placeholderText="guardian@prove.email"
              type="email"
              tooltipTitle="Enter the email address of the guardian you want to set up for account recovery"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
              label={`Guardian's Email`}
              locked={false}
              {...(guardianEmail && {
                status: emailError ? "error" : "okay",
                statusNote: emailError
                  ? "Please enter the correct email address"
                  : "Okay",
              })}
            /> */}

        <Grid item sx={{ marginX: "auto" }}>
          <Box
            sx={{ width: "330px", marginX: "auto", marginTop: "30px" }}
          ></Box>
          {isWalletPresent ? (
            <Button
              disabled={!guardianEmail || loading}
              loading={loading}
              onClick={configureRecoveryAndRequestGuardian}
              variant={"contained"}
            >
              Configure Recovery & Request Guardian
            </Button>
          ) : (
            <Button
              disabled={!guardianEmail || isBurnerWalletCreating}
              loading={isBurnerWalletCreating}
              onClick={async () => {
                await connectWallet();
                setLoading(true);
                // await new Promise((resolve) => setTimeout(resolve, 10000)); // 5000 ms = 5 seconds
                configureRecoveryAndRequestGuardian();
              }}
              variant={"contained"}
            >
              Create burner wallet
            </Button>
          )}{" "}
        </Grid>
      </Grid>
    </Box>
  );
};

export default GuardianSetup;
