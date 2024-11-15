/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- this is our only js file so far, just don't bother with types.
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const config = {
  api: {
    bodyParser: true,
    // Important: Increase the timeout as tests can take longer
    externalResolver: true,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // First, ensure ChromeDriver is killed if running
    await execAsync('pkill -f chromedriver || true')

    // Start ChromeDriver explicitly
    const chromedriver = exec('chromedriver --port=9515')

    // Wait for ChromeDriver to start
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Run the test
    const { stdout, stderr } = await execAsync(
      'npx nightwatch nightwatch/chat/test-ece-2.js',
      {
        timeout: 30000, // 30 second timeout
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
      },
    )

    // Kill ChromeDriver after test
    chromedriver.kill()

    if (stderr && !stderr.includes('Starting ChromeDriver')) {
      console.error('Test error:', stderr)
      return res.status(500).json({
        success: false,
        error: stderr,
      })
    }

    return res.status(200).json({
      success: true,
      output: stdout,
    })
  } catch (error) {
    console.error('Execution error:', error)
    // Ensure ChromeDriver is killed on error
    await execAsync('pkill -f chromedriver || true')

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
