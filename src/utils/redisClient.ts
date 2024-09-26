import { createClient } from 'redis'

// Create a Redis client
export const redisClient = createClient({
  // url: 'redis://dankchat:5438',
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
})

console.log('Redis pasword: ', process.env.REDIS_PASSWORD)

// Connect to the Redis server
redisClient
  .connect()
  .then(() => {
    console.log('Connected to Redis')
  })
  .catch((err) => {
    console.error('Redis connection error:', err)
  })
