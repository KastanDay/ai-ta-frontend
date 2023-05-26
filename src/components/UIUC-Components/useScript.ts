import { useEffect } from 'react';

// for loading scripts in next.js
// For Scite badges 

const useScript = (src: string) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [src]);

  return null;
};

export default useScript;