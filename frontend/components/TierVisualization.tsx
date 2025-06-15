"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface TierVisualizationProps {
  selectedTier: string | null;
}

const TierVisualization: React.FC<TierVisualizationProps> = ({
  selectedTier,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const anonymityRef = useRef<SVGCircleElement>(null);
  const pseudoRef = useRef<SVGCircleElement>(null);
  const identityRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const anonymity = anonymityRef.current;
    const pseudo = pseudoRef.current;
    const identity = identityRef.current;

    if (!container || !anonymity || !pseudo || !identity) return;

    // Reset all animations
    gsap.killTweensOf([anonymity, pseudo, identity]);

    // Base animation - gentle pulsing
    gsap.to(identity, {
      scale: 1.02,
      duration: 3,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
    });

    gsap.to(pseudo, {
      scale: 1.03,
      duration: 2.5,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
    });

    gsap.to(anonymity, {
      scale: 1.05,
      duration: 2,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
    });

    // Highlight based on tier selection (cumulative highlighting)
    if (selectedTier) {
      // Reset all to base opacity first
      gsap.set([anonymity, pseudo, identity], { opacity: 0.3 });

      if (selectedTier === "anonymity") {
        // Only highlight innermost circle
        gsap.to(anonymity, {
          opacity: 1,
          scale: 1.1,
          duration: 0.8,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
      } else if (selectedTier === "pseudoAnon") {
        // Highlight inner + middle circles
        gsap.to([anonymity, pseudo], {
          opacity: 1,
          duration: 0.3,
        });
        gsap.to(pseudo, {
          scale: 1.08,
          duration: 0.8,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(anonymity, {
          scale: 1.1,
          duration: 0.8,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
      } else if (selectedTier === "identity") {
        // Highlight all three circles
        gsap.to([anonymity, pseudo, identity], {
          opacity: 1,
          duration: 0.3,
        });
        gsap.to(identity, {
          scale: 1.06,
          duration: 0.8,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(pseudo, {
          scale: 1.08,
          duration: 0.8,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(anonymity, {
          scale: 1.1,
          duration: 0.8,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
    } else {
      // Reset all when none selected
      gsap.to([anonymity, pseudo, identity], {
        scale: 1,
        opacity: 0.8,
        duration: 0.5,
        ease: "power2.out",
      });
    }

    return () => {
      gsap.killTweensOf([anonymity, pseudo, identity]);
    };
  }, [selectedTier]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <div className="border-4 border-black bg-white p-6 h-full flex flex-col">
        <h3 className="font-mono font-bold text-center mb-4 text-black text-sm">
          PRIVACY TIER SUBSETS
        </h3>

        <div className="flex-1 flex items-center justify-center">
          <svg
            viewBox="0 0 300 300"
            className="w-full h-full max-h-64"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Gradients for each tier */}
              <radialGradient id="identityGradient" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="80%" stopColor="#888888" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
              </radialGradient>

              <radialGradient id="pseudoGradient" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="80%" stopColor="#666666" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.7" />
              </radialGradient>

              <radialGradient id="anonymityGradient" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#444444" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
              </radialGradient>

              <filter id="brutalistShadow">
                <feDropShadow
                  dx="2"
                  dy="2"
                  stdDeviation="0"
                  floodColor="#000000"
                  floodOpacity="0.4"
                />
              </filter>
            </defs>

            {/* Nested Circles - Largest to Smallest */}

            {/* Identity Circle - Outermost (Largest) */}
            <circle
              ref={identityRef}
              cx="150"
              cy="150"
              r="120"
              fill="url(#identityGradient)"
              stroke="#000000"
              strokeWidth="3"
              filter="url(#brutalistShadow)"
              opacity="0.8"
              className="cursor-pointer transition-all duration-300"
            />

            {/* Pseudo-Anonymity Circle - Middle */}
            <circle
              ref={pseudoRef}
              cx="150"
              cy="150"
              r="80"
              fill="url(#pseudoGradient)"
              stroke="#000000"
              strokeWidth="3"
              filter="url(#brutalistShadow)"
              opacity="0.8"
              className="cursor-pointer transition-all duration-300"
            />

            {/* Anonymity Circle - Innermost (Smallest) */}
            <circle
              ref={anonymityRef}
              cx="150"
              cy="150"
              r="40"
              fill="url(#anonymityGradient)"
              stroke="#000000"
              strokeWidth="3"
              filter="url(#brutalistShadow)"
              opacity="0.8"
              className="cursor-pointer transition-all duration-300"
            />

            {/* Labels positioned around the circles */}
            <text
              x="150"
              y="105"
              textAnchor="middle"
              className="font-mono text-xs font-bold fill-black"
            >
              ANONYMITY
            </text>
            <text
              x="150"
              y="65"
              textAnchor="middle"
              className="font-mono text-xs font-bold fill-black"
            >
              PSEUDO-ANON
            </text>
            <text
              x="150"
              y="25"
              textAnchor="middle"
              className="font-mono text-xs font-bold fill-black"
            >
              IDENTITY
            </text>

            {/* Subset notation */}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2 font-mono text-xs">
          <div
            className={`text-center p-2 border-2 ${
              selectedTier
                ? "border-black bg-black text-white"
                : "border-gray-400 bg-gray-100"
            }`}
          >
            <div className="font-bold">
              {selectedTier === "anonymity" && "ANONYMITY TIER ACTIVE"}
              {selectedTier === "pseudoAnon" && "PSEUDO-ANONYMITY TIER ACTIVE"}
              {selectedTier === "identity" && "IDENTITY TIER ACTIVE"}
              {!selectedTier && "SELECT TIER TO HIGHLIGHT SUBSETS"}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div
              className={`text-center p-1 border ${
                selectedTier &&
                (selectedTier === "anonymity" ||
                  selectedTier === "pseudoAnon" ||
                  selectedTier === "identity")
                  ? "border-black bg-black text-white"
                  : "border-gray-300"
              }`}
            >
              A: World ID
            </div>
            <div
              className={`text-center p-1 border ${
                selectedTier &&
                (selectedTier === "pseudoAnon" || selectedTier === "identity")
                  ? "border-black bg-black text-white"
                  : "border-gray-300"
              }`}
            >
              P: A + Wallet
            </div>
            <div
              className={`text-center p-1 border ${
                selectedTier === "identity"
                  ? "border-black bg-black text-white"
                  : "border-gray-300"
              }`}
            >
              I: P + DID
            </div>
          </div>
        </div>

        {/* Status */}
        {selectedTier && (
          <div className="mt-3 text-center font-mono text-xs border-2 border-black bg-black text-white p-2">
            <div className="font-bold">
              {selectedTier === "anonymity" && "HIGHLIGHTING: ANONYMITY ONLY"}
              {selectedTier === "pseudoAnon" &&
                "HIGHLIGHTING: ANONYMITY + PSEUDO"}
              {selectedTier === "identity" && "HIGHLIGHTING: ALL TIERS"}
            </div>
          </div>
        )}

        {!selectedTier && (
          <div className="mt-3 text-center font-mono text-xs border-2 border-gray-400 bg-gray-100 text-gray-500 p-2">
            <div>SELECT A TIER TO HIGHLIGHT CUMULATIVE SUBSETS</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TierVisualization;
