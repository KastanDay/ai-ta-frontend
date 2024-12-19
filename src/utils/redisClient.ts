// Create a Redis client with direct connection string format
// export const redisClient = createClient({
//   url: `redis://default:${process.env.REDIS_PASSWORD}@redis-13160.c283.us-east-1-4.ec2.redns.redis-cloud.com:13160`,
// })

import { Redis } from '@upstash/redis'

export const redisClient = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
})

// Connect to the Redis server
// redisClient
//   .connect()
//   .then(() => {
//     console.log('Connected to Redis')
//   })
//   .catch((err) => {
//     console.error('Redis connection error:', err)
//   })
