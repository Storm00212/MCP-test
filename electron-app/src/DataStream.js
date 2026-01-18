import React, { useEffect, useRef } from 'react';
import * as anime from 'animejs';

const DataStream = () => {
  const textRef = useRef(null);

  useEffect(() => {
    const text = textRef.current;
    anime({
      targets: text,
      translateY: ['100%', '-100%'],
      easing: 'linear',
      duration: 10000,
      loop: true,
    });
  }, []);

  return (
    <div className="data-stream">
      <div ref={textRef} className="scrolling-text">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i}>Data stream line {i + 1}: 0101010101010101</div>
        ))}
      </div>
    </div>
  );
};

export default DataStream;