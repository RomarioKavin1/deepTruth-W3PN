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
    <div className="flex items-center justify-center">
      <div className="relative">
        <svg
          viewBox="0 0 160 160"
          className="w-48 h-48 drop-shadow-lg"
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
                filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.5))",
              }}
            />

            {/* Square */}
            <path
              ref={squareRef}
              d="M 10 10 L 150 10 L 150 150 L 10 150 Z"
              fill="url(#blackWhiteRadial)"
              style={{
                filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.5))",
              }}
            />

            {/* Squircle */}
            <path
              ref={squircleRef}
              d="M 0 80 C 0 20, 20 0, 80 0 S 160 20, 160 80, 140 160, 80 160, 0 140, 0 80"
              fill="url(#blackWhiteRadial)"
              style={{
                filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.5))",
              }}
            />
          </g>
        </svg>

        {/* Brutalist border frame */}
        <div className="absolute inset-0 border-4 border-black pointer-events-none" />
      </div>

      {/* Tech specs display */}
      <div className="ml-8 space-y-2 font-mono text-xs">
        <div className="border-2 border-black bg-white p-3">
          <div className="text-black font-bold mb-2">PROOF MORPHOLOGY</div>
          <div className="space-y-1 text-gray-600">
            <div>○ CIRCLE → VERIFICATION</div>
            <div>□ SQUARE → ENCRYPTION</div>
            <div>◉ SQUIRCLE → STORAGE</div>
          </div>
        </div>
        <div className="border-2 border-black bg-black text-white p-3">
          <div className="font-bold mb-1">STATUS: ACTIVE</div>
          <div className="text-xs">MORPHING PROOF STATES</div>
        </div>
      </div>
    </div>
  );
};

export default MorphingAnimation;
