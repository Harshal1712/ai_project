import { genai } from './genaiClient.js';

export interface ActiveGeminiFile {
  name: string;
  uri: string;
  mimeType: string;
}

// Uploads a local file to Gemini's Files API and waits until it's ready to be
// referenced in a prompt. Callers must pass the result to deleteGeminiFile
// when done (Gemini auto-deletes after 48h regardless).
export async function uploadAndWaitForFile(filePath: string, mimeType: string, label: string): Promise<ActiveGeminiFile> {
  const uploaded = await genai.files.upload({ file: filePath, config: { mimeType } });
  if (!uploaded.name) throw new Error('Gemini Files API upload did not return a file name');

  let fileState = uploaded;
  for (let attempt = 0; attempt < 30 && fileState.state === 'PROCESSING'; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));
    fileState = await genai.files.get({ name: uploaded.name });
  }

  try {
    if (fileState.state === 'FAILED') {
      throw new Error(`Gemini failed to process the uploaded ${label}.`);
    }
    if (fileState.state !== 'ACTIVE') {
      throw new Error(`Uploaded ${label} did not become ready in time (state: ${fileState.state}).`);
    }
    if (!fileState.uri || !fileState.mimeType) {
      throw new Error(`Uploaded ${label} is missing its URI/MIME type after processing.`);
    }
  } catch (err) {
    await deleteGeminiFile(uploaded.name);
    throw err;
  }

  return { name: uploaded.name, uri: fileState.uri, mimeType: fileState.mimeType };
}

export async function deleteGeminiFile(name: string): Promise<void> {
  await genai.files.delete({ name }).catch(() => {
    // best-effort cleanup — the file auto-expires after 48h regardless
  });
}
