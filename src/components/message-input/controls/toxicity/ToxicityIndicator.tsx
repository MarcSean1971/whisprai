
import { useMemo } from "react";

interface ToxicityIndicatorProps {
  toxicityScore: number;
  lastToxicityScore: number;
  isAnalyzing: boolean;
  hasMessage: boolean;
}

export function ToxicityIndicator({
  toxicityScore,
  lastToxicityScore,
  isAnalyzing,
  hasMessage
}: ToxicityIndicatorProps) {
  const getButtonStyle = () => {
    if (!hasMessage) {
      if (lastToxicityScore > 0) {
        return getColorForScore(lastToxicityScore);
      }
      return "bg-gradient-to-r from-[#9b87f5] to-[#7C4DFF] text-white hover:opacity-90 transition-all duration-300";
    }

    if (isAnalyzing) {
      return getColorForScore(lastToxicityScore);
    }

    return getColorForScore(toxicityScore);
  };

  const getColorForScore = (score: number) => {
    const colors = {
      low: "bg-gradient-to-r from-[#4ade80] to-[#10b981]",
      medium: "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b]",
      high: "bg-gradient-to-r from-[#fb923c] to-[#f97316]",
      very_high: "bg-gradient-to-r from-[#f87171] to-[#ef4444]",
      extreme: "bg-gradient-to-r from-[#dc2626] to-[#b91c1c]"
    };

    if (score <= 20) return `${colors.low} text-white transition-all duration-300 ease-in-out hover:opacity-90`;
    if (score <= 40) return `${colors.medium} text-white transition-all duration-300 ease-in-out hover:opacity-90`;
    if (score <= 60) return `${colors.high} text-white transition-all duration-300 ease-in-out hover:opacity-90`;
    if (score <= 80) return `${colors.very_high} text-white transition-all duration-300 ease-in-out hover:opacity-90`;
    return `${colors.extreme} text-white transition-all duration-300 ease-in-out hover:opacity-90`;
  };

  return {
    buttonStyle: getButtonStyle()
  };
}
