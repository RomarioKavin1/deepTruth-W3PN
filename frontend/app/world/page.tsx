"use client"; // for Next.js app router
import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";

const page = () => {
  const handleVerify = async (proof: ISuccessResult) => {
    console.log("proof starts here : --------------------------");
    console.log(proof);
    console.log("proof ends here : --------------------------");
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proof),
    });
    if (!res.ok) {
      throw new Error("Verification failed.");
    }
  };

  const onSuccess = () => {
    window.location.href = "/success";
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <IDKitWidget
        app_id="app_6e916a8a4112922b1f33c7f899762c3d"
        action="verify-humanity"
        verification_level={VerificationLevel.Device}
        handleVerify={handleVerify}
        onSuccess={onSuccess}
        action_description="Sign up as an arbitrator"
      >
        {({ open }: { open: () => void }) => (
          <button
            onClick={open}
            className="rounded-md bg-black px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Proceed with Worldcoin Verification
          </button>
        )}
      </IDKitWidget>
    </div>
  );
};

export default page;
