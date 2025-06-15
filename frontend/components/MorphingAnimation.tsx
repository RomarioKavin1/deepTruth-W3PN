"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const MorphingAnimation: React.FC = () => {
  const shapeRef = useRef<SVGGElement>(null);
  const circleRef = useRef<SVGPathElement>(null);
  const squareRef = useRef<SVGPathElement>(null);
  const squircleRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const shape = shapeRef.current;
    const circle = circleRef.current;
    const square = squareRef.current;
    const squircle = squircleRef.current;

    if (!shape || !circle || !square || !squircle) return;

    // Create timeline
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });

    // Initial state - show circle
    gsap.set([square, squircle], { opacity: 0 });
    gsap.set(circle, { opacity: 1 });

    // Animation sequence
    tl.to(circle, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
    })
      .to(
        square,
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "-=0.2"
      )
      .to(shape, {
        rotation: 45,
        duration: 1,
        ease: "power2.inOut",
      })
      .to(
        square,
        {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "+=0.5"
      )
      .to(
        squircle,
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "-=0.2"
      )
      .to(shape, {
        rotation: 0,
        duration: 1,
        ease: "power2.inOut",
      })
      .to(
        squircle,
        {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "+=0.5"
      )
      .to(
        circle,
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "-=0.2"
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Morphing Animation - Much Bigger */}
      <div className="relative">
        <svg
          viewBox="0 0 160 160"
          className="w-96 h-96 drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="blackWhiteRadial" cx="30%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#666666" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
          </defs>

          <g ref={shapeRef}>
            {/* Circle */}
            <path
              ref={circleRef}
              d="M 0 80 C 0 37.6, 37.6 0, 80 0 S 160 37.6, 160 80, 122.4 160, 80 160, 0 122.4, 0 80"
              fill="url(#blackWhiteRadial)"
              style={{
                filter: "drop-shadow(6px 6px 0px rgba(0,0,0,0.5))",
              }}
            />

            {/* Square */}
            <path
              ref={squareRef}
              d="M 10 10 L 150 10 L 150 150 L 10 150 Z"
              fill="url(#blackWhiteRadial)"
              style={{
                filter: "drop-shadow(6px 6px 0px rgba(0,0,0,0.5))",
              }}
            />

            {/* Squircle */}
            <path
              ref={squircleRef}
              d="M 0 80 C 0 20, 20 0, 80 0 S 160 20, 160 80, 140 160, 80 160, 0 140, 0 80"
              fill="url(#blackWhiteRadial)"
              style={{
                filter: "drop-shadow(6px 6px 0px rgba(0,0,0,0.5))",
              }}
            />
          </g>
        </svg>

        {/* Brutalist border frame */}
        <div className="absolute inset-0 border-4 border-black pointer-events-none" />
      </div>

      {/* Tech specs display - Now in column layout below */}
      <div className="space-y-4 font-mono text-sm w-full max-w-sm">
        <div className="border-4 border-black bg-white p-4">
          <div className="text-black font-bold mb-3 text-lg uppercase">
            PROOF MORPHOLOGY
          </div>
          <div className="space-y-2 text-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-lg">○</span>
              <span>CIRCLE → VERIFICATION</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">□</span>
              <span>SQUARE → ENCRYPTION</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">◉</span>
              <span>SQUIRCLE → STEGANOGRAPHY</span>
            </div>
          </div>
        </div>

        <div className="border-4 border-black bg-black text-white p-4">
          <div className="font-bold mb-2 text-lg uppercase">STATUS: ACTIVE</div>
          <div className="text-sm text-gray-300">MORPHING PROOF STATES</div>
        </div>
      </div>
    </div>
  );
};

export default MorphingAnimation;
