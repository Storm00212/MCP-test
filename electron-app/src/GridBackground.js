import React, { useEffect, useRef } from 'react';
import * as anime from 'animejs';

const GridBackground = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    const lines = svg.querySelectorAll('.grid-line');

    // Animate grid lines for matrix-like effect
    anime({
      targets: lines,
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: 'easeInOutSine',
      duration: 2000,
      delay: anime.stagger(100),
      loop: true,
      direction: 'alternate',
    });
  }, []);

  return (
    <svg
      ref={svgRef}
      className="grid-background"
      width="100%"
      height="100%"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Horizontal lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <line
          key={`h-${i}`}
          className="grid-line"
          x1="0"
          y1={i * 54}
          x2="1920"
          y2={i * 54}
        />
      ))}
      {/* Vertical lines */}
      {Array.from({ length: 36 }, (_, i) => (
        <line
          key={`v-${i}`}
          className="grid-line"
          x1={i * 53.33}
          y1="0"
          x2={i * 53.33}
          y2="1080"
          stroke="#00ff00"
          strokeWidth="1"
          opacity="0.3"
        />
      ))}
    </svg>
  );
};

export default GridBackground;