import CircleIcon from "@mui/icons-material/Circle";
import { Box, Grid, Typography } from "@mui/material";
import { ConnectKitButton } from "connectkit";

const ConnectedWalletCard = ({ address }: { address?: string }) => {
  return (
    <Box
      borderRadius={3}
      sx={{
        marginX: "auto",
        backgroundColor: "#FCFCFC",
        border: "1px solid #E3E3E3",
        padding: { xs: 2, md: 1 },
      }}
    >
      <Grid container justifyContent={"center"} alignItems={"center"} gap={2}>
        <Grid item container xs="auto">
          <CircleIcon
            sx={{
              color: address ? "#6DD88B" : "#FB3E3E",
              transition: "color 0.5s ease-in-out",
            }}
          />
          <Grid item>
            <Typography> Connected Wallet: </Typography>
          </Grid>
        </Grid>
        <Grid item>
          <ConnectKitButton />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConnectedWalletCard;
