import { CircularProgress, Button as MuiButton, useTheme } from "@mui/material";
import React, { ReactNode } from "react";

type CustomButtonProps = {
  endIcon?: ReactNode;
  loading?: boolean;
  filled?: boolean; // Add the filled prop
  variant?: "text" | "outlined" | "contained";
} & React.ComponentPropsWithoutRef<"button">; // Ensure compatibility with standard button props

export function Button({
  children,
  endIcon,
  loading,
  variant = "text",
  ...buttonProps
}: CustomButtonProps) {
  const theme = useTheme();

  const getStyles = () => {
    switch (variant) {
      case "text":
        return {
          color: theme.palette.text.primary, // Set text color based on filled prop
          ":hover": {
            // backgroundColor: filled ? "#FD4BA1" : "#E0F6FF", // Background color on hover
          },
          ":focus": {
            outline: "none", // Remove outline on focus
          },
          ":active": {
            outline: "none", // Remove outline on active
          },
          ":disabled": {
            backgroundColor: "#FAC5DF",
            color: "#ffffff",
          },
        };

      case "outlined":
        return {
          color: theme.palette.text.primary, // Set text color based on filled prop
          background: '#EBEBEB20', // Set text color based on filled prop
          border: "2px solid #a6a6a6",
          ":hover": {
            // backgroundColor: filled ? "#FD4BA1" : "#E0F6FF", // Background color on hover
          },
          ":focus": {
            outline: "none", // Remove outline on focus
          },
          ":active": {
            outline: "none", // Remove outline on active
          },
          ":disabled": {
            backgroundColor: "#FAC5DF",
            color: "#ffffff",
          },
        };

      case "contained":
        return {
          color: 'white', // Set text color based on filled prop
          background: theme.palette.primary.main, // Set text color based on filled prop
          ":hover": {
            background: "#EA1E80", // Set text color based on filled prop
            // backgroundColor: filled ? "#FD4BA1" : "#E0F6FF", // Background color on hover
          },
          ":focus": {
            outline: "none", // Remove outline on focus
          },
          ":active": {
            outline: "none", // Remove outline on active
          },
          ":disabled": {
            backgroundColor: "#FAC5DF",
            color: "#ffffff",
          },
        };

      default:
        break;
    }
  };

  return (
    <MuiButton
      {...buttonProps}
      sx={{
        borderRadius: "12px",
        paddingX: "36px",
        paddingY: "12px",
        textTransform: "none",
        ...getStyles(),
        ...buttonProps.sx,
      }}
      fullWidth
      endIcon={loading ? <CircularProgress size={24} /> : endIcon}
      disabled={loading || buttonProps.disabled}
    >
      {children}
    </MuiButton>
  );
}
