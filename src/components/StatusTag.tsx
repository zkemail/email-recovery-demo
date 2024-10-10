import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import SecurityIcon from "@mui/icons-material/Security";
import { Box, Typography } from "@mui/material";
import React from "react";

type StatusTagProps = {
  status: "Guarded" | "Recovered";
};

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const isGuarded = status === "Guarded";

  const icon = isGuarded ? (
    <SecurityIcon sx={{ padding: "6px" }} />
  ) : (
    <MonetizationOnIcon sx={{ padding: "6px" }} />
  );
  const color = isGuarded ? "#0069E4" : "#0A6825";
  const backgroundColor = isGuarded ? "#EFF8FF" : "#E7FDED";
  const borderColor = isGuarded ? "#B2DDFF" : "#6DD88B";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        padding: "0px 10px 0px 2px",
        gap: "0px",
        borderRadius: "9999px",
        border: `2px solid ${borderColor}`,
        backgroundColor: backgroundColor,
        color: color,
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          color: color,
          paddingX: "0px",
        }}
      >
        {icon}
      </Box>
      <Typography variant="body1" sx={{ fontWeight: "bold", fontSize: "10px" }}>
        {status}
      </Typography>
    </Box>
  );
};

export default StatusTag;
