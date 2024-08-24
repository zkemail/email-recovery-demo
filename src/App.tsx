import { createContext, useState } from "react";
import "./App.css";
import { STEPS } from "./constants";
import { AppContextProvider } from "./context/AppContextProvider";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landingPage";
import ErrorPage from "./pages/errorPage";
import SafeWalletFlow from "./pages/safeWalletFlow";
import { ThemeProvider } from "@mui/material";
import theme from "./theme"; // Import custom theme
import RecoverWalletFlow from "./pages/recoverWalletFlow";
import NavBar from "./components/Navbar";
import BurnerWalletFlow from "./pages/burnerWalletFlow";

export const StepsContext = createContext(null);

function App() {
  const [step, setStep] = useState(STEPS.STEP_SELECTION);

  return (
    <AppContextProvider>
      <ThemeProvider theme={theme}>
        <StepsContext.Provider
          value={{
            step,
            setStep,
          }}
        >
          <BrowserRouter>
            <NavBar />
            <div style={{ padding: 16 }}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/safe-wallet" element={<SafeWalletFlow />} />
                <Route path="/burner-wallet" element={<BurnerWalletFlow />} />
                <Route
                  path="/wallet-recovery"
                  element={<RecoverWalletFlow />}
                />
                <Route path="*" element={<ErrorPage />} />
              </Routes>
            </div>
          </BrowserRouter>
        </StepsContext.Provider>
      </ThemeProvider>
    </AppContextProvider>
  );
}

export default App;
