import { NextPage } from 'next'
import { useEffect, useState } from 'react'

const Page: NextPage = () => {
  const [myEventNameData, setMyEventNameData] = useState<Array<string>>([])

  // pages/index.js

  useEffect(() => {
    // const eventSource = new EventSource(`/api/sse`, {
    //   withCredentials: true,
    // });
    const eventSource = new EventSource(`/api/UIUC-api/ingestCallbackvthree`, {
      withCredentials: true,
    })
    eventSource.onopen = () => {
      console.log('open');
    };
    eventSource.onmessage = (e) => {
      console.log(e.data);
      const parsedData = JSON.parse(e.data)
      setMyEventNameData((prevData) => [...prevData, parsedData])
    };
    eventSource.onerror = (e) => {
      console.log(e);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // const callSSE = () => {
  //   console.log('In callSSE')
  //   const eventSource = new EventSource(`/api/UIUC-api/ingestCallbackvthree`)
  //   eventSource.addEventListener('myEventName', (e) => {
  //     console.log('in myEventName event listener', e.data)
  //     // the event name here must be the same as in the API
  //     const parsedData = JSON.parse(e.data)
  //     console.log(parsedData)
  //     setMyEventNameData((prevData) => [...prevData, parsedData])
  //   })
  //   eventSource.addEventListener('open', (e) => {
  //     console.log('open', e)
  //   })
  //   eventSource.addEventListener('error', (e) => {
  //     console.log('error', e)
  //     eventSource.close()
  //   })
  // }

  return (
    <div>
      {/* <button onClick={callSSE}>GET SSE</button> */}
      <h2>Events:</h2>
      <ol>
        {myEventNameData.map((data, index) => (
          <li key={index}>{JSON.stringify(data)}</li>
        ))}
      </ol>
    </div>
  )
}

export default Page

// import { NextPage } from 'next'
// import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
// import TestEventSourceComponent from '~/components/UIUC-Components/TestEventSourceComponent'

// const Events: NextPage = () => {
//   console.log('In Events.tsx')
//   return (
//     <MainPageBackground>
//       <TestEventSourceComponent />
//     </MainPageBackground>
//   )
// }

// export default Events
