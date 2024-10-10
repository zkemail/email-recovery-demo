import { Box, Grid, Typography } from "@mui/material";
import { useContext } from "react";
import { Button } from "./Button";
import { StepsContext } from "../App";
import { STEPS } from "../constants";

const WalletActions = () => {
  const stepsContext = useContext(StepsContext);

  return (
    <div className="connect-wallets-container">
      <Box sx={{ marginX: "auto", marginTop: "180px" }}>
        <Typography variant="h2" sx={{ paddingBottom: "20px" }}>
          Wallet Actions
        </Typography>
        <Grid
          container
          justifyContent={"center"}
          alignItems={"center"}
          gap="1rem"
        >
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => stepsContext?.setStep(STEPS.CONFIGURE_GUARDIANS)}
              disabled
            >
              Edit Guardians
            </Button>
          </Grid>
          <Grid>
            <Button
              variant="outlined"
              onClick={() => stepsContext?.setStep(STEPS.REQUESTED_RECOVERIES)}
            >
              Trigger Recovery
            </Button>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default WalletActions;
