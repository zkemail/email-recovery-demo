import { useContext } from "react";
import { StepsContext } from "../App";
import RequestedRecoveries from "../components/RequestedRecoveries";
import { STEPS } from "../constants";

const RecoverWalletFlow = () => {
  const stepsContext = useContext(StepsContext);

  const renderBody = () => {
    switch (stepsContext?.step) {
      case STEPS.REQUESTED_RECOVERIES:
        return <RequestedRecoveries />;
      default:
        return <RequestedRecoveries />;
    }
  };

  return (
    <div>
      <div className="app">{renderBody()}</div>
    </div>
  );
};

export default RecoverWalletFlow;
