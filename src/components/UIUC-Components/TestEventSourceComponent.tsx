// components/EventDisplay.js
import React, { useState, useEffect } from 'react'

// Define the event type
// interface Event {
//   time: string
// }

const EventDisplay = () => {
  // Explicitly type the state
  const [events, setEvents] = useState([])

  useEffect(() => {
    const eventSource = new EventSource('/api/UIUC-api/eventSourceUpdates')

    eventSource.onopen = function (event) {
      console.log('Connection to event source opened.', event)
    }

    // In case of any error, close the event source
    // So that it attempts to connect again
    eventSource.onerror = function (error) {
      console.error('Event source error:', error)
      eventSource.close()
    }

    eventSource.onmessage = function (event) {
      console.log('event.data:', event.data)
      try {
        const newEvent: Event = JSON.parse(event.data)
        setEvents((prevEvents) => [...prevEvents, newEvent])
      } catch (error) {
        console.error('Error parsing event data:', error)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return (
    <div>
      <h1>Server-Sent Events {events[0]}</h1>

      <ul>
        {/* {events.map((event, index) => (
          <li key={index}>Time from server: {event.time}</li>
        ))} */}
        {events.map((event, index) => (
          <li key={index}>Time from server: {event}</li>
        ))}
      </ul>
    </div>
  )
}

export default EventDisplay
