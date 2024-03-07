// components/EventDisplay.js
import React, { useState, useEffect } from 'react'

interface Event {
  myTask: string
}

const EventDisplay = () => {
  // Explicitly type the state with the Event interface
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const eventSource = new EventSource('/api/UIUC-api/eventSourceUpdates')

    eventSource.onopen = function (event) {
      console.log('Connection to event source opened.', event)
    }

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
      <h1>Server-Sent Events</h1>
      <ul>
        {events.map((event, index) => (
          <li key={index}>Time from server: {JSON.stringify(event)}</li>
        ))}
      </ul>
    </div>
  )
}

export default EventDisplay
