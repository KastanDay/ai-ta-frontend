import React, { useRef, useEffect } from 'react';
import useScript from './useScript'; // Import the custom hook

const SciteBadge = ( {doi }: {doi?: string}) => {
  useScript('https://cdn.scite.ai/badge/scite-badge-latest.min.js'); // Use the custom hook

  const badgeRef = useRef(null);

  const default_pub = '10.1007/978-3-030-58452-8_13'

  useEffect(() => {
    if (badgeRef.current) {
      // badgeRef.current.innerHTML = '';
      const badge = document.createElement('div');
      badge.className = 'scite-badge';
      // badge.setAttribute('data-doi', '10.1016/j.biopsych.2005.08.012');
      badge.setAttribute('data-doi', doi || default_pub);
      // badge.setAttribute('data-tally-show', 'true');
      badge.setAttribute('data-show-labels', 'true');
      badge.setAttribute('data-section-tally-show', 'false');
      // badgeRef.current.appendChild(badge);
    }
  }, []);

  return (
    <div>
      {/* Other components */}
      <div ref={badgeRef}></div>
    </div>
  );
};

export default SciteBadge;