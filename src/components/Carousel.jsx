import React, { useEffect, useState } from 'react';

/**
 * A simple auto-playing carousel that fades between slides. This component
 * cycles through the provided images array every few seconds. It renders
 * children as backgrounds for full-bleed hero images.
 */
const Carousel = ({ images = [], interval = 5000 }) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images, interval]);
  return (
    <div className="relative w-full overflow-hidden h-52 md:h-80 rounded-b-3xl shadow-2xl">
      {images.map((src, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === i ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img
            src={src}
            alt={`Slide ${i + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {/* Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`transition-all duration-300 rounded-full ${
                index === i
                  ? 'w-8 h-2 bg-white shadow-lg'
                  : 'w-2 h-2 bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;