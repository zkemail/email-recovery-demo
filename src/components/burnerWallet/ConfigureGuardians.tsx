import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { readContract } from "wagmi/actions";
import { safeEmailRecoveryModule } from "../../../contracts.base-sepolia.json";
import { universalEmailRecoveryModule } from "../../../contracts.base-sepolia.json";
import { safeEmailRecoveryModuleAbi } from "../../abi/SafeEmailRecoveryModule";
import { abi as universalEmailRecoveryModuleAbi } from "../../abi/UniversalEmailRecoveryModule.json";
import { StepsContext } from "../../App";
import { STEPS } from "../../constants";
import { useBurnerAccount } from "../../context/BurnerAccountContext";
import { config } from "../../providers/config";
import { relayer } from "../../services/relayer";
import { Button } from "../Button";
import InputField from "../InputField";

interface GuardianInfo {
  email: string;
  guardianAddr: `0x${string}`;
  accountAddr: `0x${string}`;
}

const AddGuardianModal = ({
  open,
  handleClose,
  newGuardianAddress,
  setNewGuardianAddress,
  newGuardianEmail,
  setNewGuardianEmail,
  handleAddGuardian,
  isAddGuardianLoading,
}: {
  open: boolean;
  handleClose: () => void;
  newGuardianAddress: string;
  setNewGuardianAddress: (address: string) => void;
  newGuardianEmail: string;
  setNewGuardianEmail: (email: string) => void;
  handleAddGuardian: () => void;
  isAddGuardianLoading: boolean;
}) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="parent-dialog-title"
      aria-describedby="parent-dialog-description"
      PaperProps={{
        style: {
          borderRadius: "16px",
          width: "40rem",
        },
      }}
    >
      <DialogTitle id="parent-dialog-title" style={{ fontWeight: "bold" }}>
        Add Guardian
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <InputField
              type="email"
              value={newGuardianEmail || ""}
              placeholderText="test@gmail.com"
              onChange={(e) => setNewGuardianEmail(e.target.value)}
              label="Guardian Email"
            />
          </Grid>
          <Grid item xs={12}>
            <InputField
              type="string"
              value={newGuardianAddress || ""}
              placeholderText="0xAB12..."
              onChange={(e) => setNewGuardianAddress(e.target.value)}
              label="Guardian Address"
            />
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={isAddGuardianLoading}
            >
              Cancel
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              onClick={handleAddGuardian}
              disabled={isAddGuardianLoading}
              loading={isAddGuardianLoading}
              variant={"contained"}
            >
              Add Guardian
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

const ConfigureGuardians = () => {
  const stepsContext = useContext(StepsContext);
  const accountCode = localStorage.getItem("safe1_3AccountCode");
  const { burnerAccountClient } = useBurnerAccount();

  const [newGuardianAddress, setNewGuardianAddress] = useState<string>("");
  const [newGuardianEmail, setNewGuardianEmail] = useState<string>("");
  const [isAddGuardianLoading, setIsAddGuardianLoading] =
    useState<boolean>(false);
  const [isAddGuardianModalOpen, setIsAddGuardianModalOpen] =
    useState<boolean>(false);
  const [activeGuardianAddressRemoval, setActiveGuardianAddressRemoval] =
    useState<string>("");

  // Since currently there is no way to get guardians, we are storing guardian related information in the localstorage
  const burnerWalletGuardians: string | null = localStorage.getItem(
    "burnerWalletGuardians"
  );
  const guardians: GuardianInfo[] = burnerWalletGuardians
    ? JSON.parse(burnerWalletGuardians)
    : [];

  if (!accountCode) {
    toast.error("Something went wrong");
    stepsContext?.setStep(STEPS.CONFIGURE_GUARDIANS);
  }

  const handleAddGuardian = async () => {
    setIsAddGuardianLoading(true);
    // The account code is unique for each account.
    const guardianSalt = await relayer.getAccountSalt(
      accountCode,
      newGuardianEmail
    );

    const guardianAddr = await readContract(config, {
      abi: safeEmailRecoveryModuleAbi,
      address: safeEmailRecoveryModule as `0x${string}`,
      functionName: "computeEmailAuthAddress",
      args: [newGuardianAddress, guardianSalt],
    });

    try {
      await burnerAccountClient.writeContract({
        abi: universalEmailRecoveryModuleAbi,
        address: universalEmailRecoveryModule as `0x${string}`,
        functionName: "addGuardian",
        args: [guardianAddr, 1n],
      });

      // Once the guardian is added on the chain, we add them to the localstorage as well
      try {
        // Check if burnerWalletGuardians is not null before parsing
        const guardians = burnerWalletGuardians
          ? JSON.parse(burnerWalletGuardians)
          : [];

        // Prepare the new guardian object
        const newGuardian: GuardianInfo = {
          email: newGuardianEmail,
          guardianAddr,
          accountAddr: newGuardianAddress,
        };

        // Add the new guardian to the array and save it back to localStorage
        localStorage.setItem(
          "burnerWalletGuardians",
          JSON.stringify([...guardians, newGuardian])
        );
      } catch (error) {
        console.error("Failed to parse guardians from localStorage", error);
        // You might want to initialize localStorage here if needed
      }

      setIsAddGuardianModalOpen(false);
      toast.success("Guardian added successfully");
    } catch (err) {
      toast.error(`Something went wrong: ${err}`);
      console.log(err);
    } finally {
      setIsAddGuardianLoading(false);
    }
  };

  const handleRemoveGuardian = async (guardianAddr: `0x${string}`) => {
    setActiveGuardianAddressRemoval(guardianAddr);

    await burnerAccountClient.writeContract({
      abi: universalEmailRecoveryModuleAbi,
      address: universalEmailRecoveryModule as `0x${string}`,
      functionName: "removeGuardian",
      args: [guardianAddr],
    });

    localStorage.setItem(
      "burnerWalletGuardians",
      JSON.stringify(
        guardians.filter(
          (guardian: GuardianInfo) => guardian.guardianAddr !== guardianAddr
        )
      )
    );
    setActiveGuardianAddressRemoval("");
  };

  return (
    <div className="connect-wallets-container">
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
              stepsContext?.setStep(STEPS.WALLET_ACTIONS);
            }}
            sx={{ textAlign: "left", cursor: "pointer", width: "auto" }}
          >
            ← Back
          </Button>
        </Grid>
        <Typography variant="h2" sx={{ paddingBottom: "20px" }}>
          Configure Guardians
        </Typography>
        <Grid container spacing={4}>
          <Grid
            container
            item
            justifyContent={"space-between"}
            alignItems={"center"}
          >
            <Grid item>
              <Typography variant="h5">Current guardians:</Typography>
            </Grid>
            <Grid item>
              <Button
                onClick={() => {
                  setNewGuardianAddress("");
                  setNewGuardianEmail("");
                  setIsAddGuardianModalOpen(true);
                }}
                variant={"contained"}
              >
                + Add Guardian
              </Button>
            </Grid>
          </Grid>
          <Grid container item spacing={2}>
            {/* TODO: Update guardian addresses */}
            {guardians?.map((guardianInfo) => (
              <Grid
                container
                item
                alignItems={"center"}
                justifyContent={"space-between"}
                direction={"row"}
              >
                <Grid item textAlign={"left"}>
                  <Typography fontWeight={"bold"}>
                    {guardianInfo.email}
                  </Typography>
                  <Typography>{guardianInfo.accountAddr}</Typography>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    disabled={
                      activeGuardianAddressRemoval !== "" &&
                      activeGuardianAddressRemoval !== guardianInfo.guardianAddr
                    }
                    loading={
                      activeGuardianAddressRemoval === guardianInfo.guardianAddr
                    }
                    onClick={() =>
                      handleRemoveGuardian(guardianInfo.guardianAddr)
                    }
                  >
                    {activeGuardianAddressRemoval === guardianInfo.guardianAddr
                      ? "Removing"
                      : "Remove"}
                  </Button>
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <AddGuardianModal
          open={isAddGuardianModalOpen}
          handleClose={() => setIsAddGuardianModalOpen(false)}
          newGuardianAddress={newGuardianAddress}
          setNewGuardianAddress={setNewGuardianAddress}
          newGuardianEmail={newGuardianEmail}
          setNewGuardianEmail={setNewGuardianEmail}
          handleAddGuardian={handleAddGuardian}
          isAddGuardianLoading={isAddGuardianLoading}
        />
      </Box>
    </div>
  );
};

export default ConfigureGuardians;
