"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeepgramToken = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
// Cache the project ID to avoid repeated API calls
let cachedProjectId = null;
async function getProjectId(apiKey) {
    if (cachedProjectId)
        return cachedProjectId;
    const response = await fetch('https://api.deepgram.com/v1/projects', {
        headers: {
            'Authorization': `Token ${apiKey}`,
        },
    });
    if (!response.ok) {
        throw new Error('Failed to get Deepgram projects');
    }
    const data = await response.json();
    if (!data.projects || data.projects.length === 0) {
        throw new Error('No Deepgram projects found');
    }
    cachedProjectId = data.projects[0].project_id;
    return cachedProjectId;
}
/**
 * Generate a temporary Deepgram API key for client-side use
 * The key expires after 2 minutes and has limited scopes
 */
exports.getDeepgramToken = functions.https.onCall(async (_data, context) => {
    var _a;
    // Require authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to use voice input');
    }
    // Get API key from environment config
    const apiKey = (_a = functions.config().deepgram) === null || _a === void 0 ? void 0 : _a.api_key;
    if (!apiKey) {
        console.error('DEEPGRAM_API_KEY not configured. Set it with: firebase functions:config:set deepgram.api_key="YOUR_KEY"');
        throw new functions.https.HttpsError('failed-precondition', 'Voice input not configured');
    }
    try {
        // Get the project ID
        const projectId = await getProjectId(apiKey);
        // Create a temporary key
        const response = await fetch(`https://api.deepgram.com/v1/projects/${projectId}/keys`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                comment: `Temp key for ${context.auth.uid}`,
                scopes: ['usage:write'],
                time_to_live_in_seconds: 120, // 2 minutes
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('Deepgram API error:', error);
            throw new functions.https.HttpsError('internal', 'Failed to generate voice input token');
        }
        const data = await response.json();
        return {
            token: data.key,
        };
    }
    catch (error) {
        console.error('Error generating Deepgram token:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to generate voice input token');
    }
});
//# sourceMappingURL=index.js.map