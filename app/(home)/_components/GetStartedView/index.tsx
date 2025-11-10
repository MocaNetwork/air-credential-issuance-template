import { DebuggingInfo } from "./components";
import { IssuanceModalEnhanced } from "./components/IssuanceModalEnhanced";

export const GetStartedView = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
      <IssuanceModalEnhanced />
      <DebuggingInfo />
    </div>
  );
};
