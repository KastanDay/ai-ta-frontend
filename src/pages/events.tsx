import { NextPage } from 'next'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import TestEventSourceComponent from '~/components/UIUC-Components/TestEventSourceComponent'

const Events: NextPage = () => {
  console.log('In Events.tsx')
  return (
    <MainPageBackground>
      <TestEventSourceComponent />
    </MainPageBackground>
  )
}

export default Events
