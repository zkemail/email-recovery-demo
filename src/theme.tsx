// theme.tsx
import { createTheme } from "@mui/material/styles";

// Define your Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#FD3E9A",
    },
    secondary: {
      main: "#8E8E8E",
    },
  },
  typography: {
    fontFamily: "Fustat",
    h1: {
      fontFamily: "Newsreader",
      color: "#000000",
      fontSize: "3rem",
      fontWeight: "300",
    },
    h2: {
      fontFamily: "Newsreader",
      fontWeight: "300",
      color: "#333741",
      letterSpacing: -1,
    },

    h4: {
      color: "#333741",
    },
    h5: {
      color: "#333741",
    },

    h6: {
      color: "#8E8E8E",
      fontSize: "20px",
      fontWeight: "500",
      lineHeight: "140%",
    },

    body1: {
      fontSize: "1rem", // Adjust the font size as needed
      fontWeight: "400",
      lineHeight: "1.5",
      color: "#333741", // Ensure good contrast and readability
    },
    body2: {
      fontSize: "0.875rem", // Slightly smaller than body1
      fontWeight: "400",
      lineHeight: "1.5",
      color: "#333741",
    },
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "black",
        },
      },
    },
  },
});

export default theme;
