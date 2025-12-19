import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

interface DeepgramProject {
  project_id: string
  name: string
}

interface DeepgramProjectsResponse {
  projects: DeepgramProject[]
}

interface DeepgramKeyResponse {
  api_key_id: string
  key: string
}

// Cache the project ID to avoid repeated API calls
let cachedProjectId: string | null = null

async function getProjectId(apiKey: string): Promise<string> {
  if (cachedProjectId) return cachedProjectId

  const response = await fetch('https://api.deepgram.com/v1/projects', {
    headers: {
      'Authorization': `Token ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get Deepgram projects')
  }

  const data = await response.json() as DeepgramProjectsResponse
  if (!data.projects || data.projects.length === 0) {
    throw new Error('No Deepgram projects found')
  }

  cachedProjectId = data.projects[0].project_id
  return cachedProjectId
}

/**
 * Generate a temporary Deepgram API key for client-side use
 * The key expires after 2 minutes and has limited scopes
 */
export const getDeepgramToken = functions.https.onCall(
  async (
    _data: unknown,
    context: functions.https.CallableContext
  ) => {
    // Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be logged in to use voice input'
      )
    }

    // Get API key from environment config
    const apiKey = functions.config().deepgram?.api_key
    if (!apiKey) {
      console.error('DEEPGRAM_API_KEY not configured')
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Voice input not configured'
      )
    }

    try {
      // Get the project ID
      const projectId = await getProjectId(apiKey)

      // Create a temporary key that expires in 2 minutes
      const response = await fetch(
        `https://api.deepgram.com/v1/projects/${projectId}/keys`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: `Temp key for ${context.auth.uid}`,
            scopes: ['usage:write'],
            time_to_live_in_seconds: 900, // 15 minutes
          }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('Deepgram API error:', error)
        throw new functions.https.HttpsError(
          'internal',
          'Failed to generate voice input token'
        )
      }

      const data = await response.json() as DeepgramKeyResponse

      return {
        token: data.key,
      }
    } catch (error) {
      console.error('Error generating Deepgram token:', error)
      if (error instanceof functions.https.HttpsError) {
        throw error
      }
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate voice input token'
      )
    }
  }
)
