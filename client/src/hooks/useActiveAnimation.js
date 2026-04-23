import useDemoFlow from "./useDemoFlow";

export default function useActiveAnimation() {
  const { currentStep } = useDemoFlow();

  return {
    active: currentStep,
    riskPulse: currentStep === "cyclone",
    sosPulse: currentStep === "sos",
    calmMode: currentStep === "panic",
    familyHighlight: currentStep === "family",
    volunteerHighlight: currentStep === "volunteer"
  };
}
