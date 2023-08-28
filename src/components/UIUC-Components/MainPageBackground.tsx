import Link from 'next/link'
import React, { ReactNode } from 'react'
import GlobalHeader from './GlobalHeader'
import GlobalFooter from './GlobalFooter'


interface MainPageBackgroundProps {
  children: ReactNode
}

export const MainPageBackground: React.FC<MainPageBackgroundProps> = ({
  children,
}) => {
  return (
    <>
      <GlobalHeader />
      <main className="items-left justify-left course-page-main flex min-h-screen flex-col">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-5 ">
          <Link href="/">
            <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
              UIUC Course{' '}
              <span className="${inter.style.fontFamily} text-[hsl(280,100%,70%)]">
                AI
              </span>
            </h2>
          </Link>
          <br></br>
          {/* 
          LOAD THE SPINNER ELEMENT (or any other body text) here!
          USAGE EXAMPLE: 
          <MainPageBackground>
            <LoadingSpinner />
          </MainPageBackground>
           */}
          {children}
        </div>
        <div className="items-left container flex flex-col justify-center gap-12 px-20 py-16 "></div>
        <GlobalFooter />
      </main>
    </>
  )
}

// export default MainPageBackground
