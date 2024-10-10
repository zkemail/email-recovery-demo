import { ThemeProvider } from "@mui/material";
import { createContext, useState } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NavBar from "./components/Navbar";
import { STEPS } from "./constants";
import { AppContextProvider } from "./context/AppContextProvider";
import BurnerWalletFlow from "./pages/burnerWalletFlow";
import ErrorPage from "./pages/errorPage";
import LandingPage from "./pages/landingPage";
import RecoverWalletFlow from "./pages/recoverWalletFlow";
import SafeWalletFlow from "./pages/safeWalletFlow";
import { Web3Provider } from "./providers/Web3Provider";
import theme from "./theme"; // Import custom theme

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
          <Web3Provider>
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
          </Web3Provider>
        </StepsContext.Provider>
      </ThemeProvider>
    </AppContextProvider>
  );
}

export default App;
