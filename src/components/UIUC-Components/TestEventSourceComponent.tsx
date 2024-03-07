// components/EventDisplay.js
import React, { useState, useEffect } from 'react'

// Define the event type
interface Event {
  time: string
}

const EventDisplay = () => {
  // Explicitly type the state
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const eventSource = new EventSource('/api/UIUC-api/eventSourceUpdates')

    eventSource.onmessage = function (event) {
      console.log('event.data:', event.data)
      const newEvent: Event = JSON.parse(event.data)
      setEvents((prevEvents) => [...prevEvents, newEvent])
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return (
    <div>
      <h1>Server-Sent Events {events[0]?.time}</h1>
      <ul>
        {/* {events.map((event, index) => (
          <li key={index}>Time from server: {event.time}</li>
        ))} */}
        {events.map((event, index) => (
          <li key={index}>Time from server: {event.time}</li>
        ))}
      </ul>
    </div>
  )
}

export default EventDisplay
