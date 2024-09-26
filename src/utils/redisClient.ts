import { createClient } from 'redis'
import { ProjectWideLLMProviders } from '~/types/courseMetadata'

// Create a Redis client
export const redisClient = createClient({
  // url: 'redis://dankchat:5438',
  url: 'redis://100.120.19.97:5438',
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
