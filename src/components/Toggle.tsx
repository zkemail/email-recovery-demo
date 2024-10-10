import { styled } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import * as React from "react";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(() => ({
  "&.MuiToggleButtonGroup-root": {
    backgroundColor: "#F3F3F3",
    borderRadius: "12px",
    padding: "4px",
  },
  "& .MuiToggleButton-root": {
    border: "none",
    color: "#000",
    fontSize: '16px',
    fontWeight: "semibold",
    borderRadius: "12px",
    "&.Mui-selected": {
      backgroundColor: "white",
      border: "2px solid #EBEBEB",
      color: "black",
    },
    "&:focus": {
      outline: "none",
      boxShadow: "none",
    },
  },
}));

export default function CustomizedToggleButton({ onFlowChange }) {
  const [alignment, setAlignment] = React.useState("setup");

  const handleAlignment = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string
  ) => {
    if (newAlignment !== null) {
      setAlignment(newAlignment);
      onFlowChange(newAlignment);
    }
  };

  return (
    <StyledToggleButtonGroup
      value={alignment}
      exclusive
      onChange={handleAlignment}
      aria-label="toggle button"
      sx={{
        marginY: "25px",
        paddingX: "30px",
        height: "40px",
        justifyContent: "center",
        gap: "10px",
      }}
    >
      <ToggleButton
        value="setup"
        aria-label="set up"
        sx={{ textTransform: "none", paddingY: "3px", paddingX: "36.5px" }}
      >
        Set Up
      </ToggleButton>
      <ToggleButton
        value="recover"
        aria-label="recover"
        sx={{ textTransform: "none", paddingY: "3px", paddingX: "36.5px" }}
      >
        Recover
      </ToggleButton>
    </StyledToggleButtonGroup>
  );
}
