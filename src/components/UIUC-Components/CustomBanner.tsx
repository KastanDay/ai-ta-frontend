import React, { useState, useEffect } from 'react'
import NextImage from 'next/image'

function BannerComponent({ bannerUrl }: { bannerUrl: string }) {
  const [minHeight, setMinHeight] = useState(100) // Initial minimum height in pixels

  const min_height_px = 100
  const max_height_px = '80px'

  useEffect(() => {
    const img = new Image()
    img.src = bannerUrl
    img.onload = function () {
      setMinHeight(Math.min(min_height_px, img.height)) // Set minimum height to the smaller of 100px and the image's original height
    }
  }, [bannerUrl])

  // No banner
  if (!bannerUrl) {
    return null
  }

  return (
    <div
      style={{
        width: '100%',
        maxHeight: max_height_px,
        overflow: 'hidden',
        minHeight: `${minHeight}px`,
      }}
    >
      <NextImage
        src={bannerUrl}
        width={1440}
        height={640}
        quality={90}
        alt="Banner image of course"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
        }}
      />
    </div>
  )
}

export default BannerComponent
