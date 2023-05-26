import { useEffect } from 'react';

const SciteBadge = ({ course_name }: { course_name?: string }) => {
  console.log("WERE IN SCITE BADGE COMPONENT")
  
  const useScript = (src) => {
    useEffect(() => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
  
      return () => {
        document.body.removeChild(script);
      };
    }, [src]);
  };

  return (
    <>
      <script async type="application/javascript" src="https://cdn.scite.ai/badge/scite-badge-latest.min.js"></script>
      <div className="scite-badge" data-doi="10.1016/j.biopsych.2005.08.012" data-tally-show='true' data-show-labels='true' data-section-tally-show='false' />
    </>
  )};

export default SciteBadge