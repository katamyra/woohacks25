import dialogflow from '@google-cloud/dialogflow';

// Load the project ID and Dialogflow credentials from environment variables
const projectId = process.env.DIALOGFLOW_PROJECT_ID;
if (!projectId) {
  throw new Error("DIALOGFLOW_PROJECT_ID environment variable not defined.");
}

const credentialsEnv = process.env.DIALOGFLOW_CREDENTIALS;
if (!credentialsEnv) {
  throw new Error("DIALOGFLOW_CREDENTIALS environment variable not defined.");
}
const credentials = JSON.parse(credentialsEnv);

// Create and export the Dialogflow SessionsClient
const sessionClient = new dialogflow.SessionsClient({
  projectId,
  credentials,
});

export default sessionClient; 