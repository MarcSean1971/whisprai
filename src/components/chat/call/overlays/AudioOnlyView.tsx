
import React from "react";
import { CallTimer } from "../CallTimer";

interface AudioOnlyViewProps {
  duration?: number;
}

export function AudioOnlyView({ duration = 0 }: AudioOnlyViewProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#f1f0fb]">
      <div className="flex flex-col items-center text-center p-8">
        <div className="w-20 h-20 rounded-full bg-[#7C4DFF] flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        </div>
        <div className="text-lg font-medium text-[#4b3a6b]">Audio Call</div>
        {duration > 0 && <CallTimer duration={duration} />}
      </div>
    </div>
  );
}
