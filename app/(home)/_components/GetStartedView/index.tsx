import { DebuggingInfo } from "./components";
import { IssuanceModal } from "./components/IssuanceModal";

export const GetStartedView = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
      <IssuanceModal />
      <DebuggingInfo />
    </div>
  );
};
