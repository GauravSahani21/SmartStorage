import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const VALID_CATEGORIES = ['marksheet', 'certificate', 'assignment', 'id_card', 'admission', 'fee_receipt', 'other'];

/**
 * Uses Gemini Flash to classify a student document by filename + mimeType.
 * Returns { category, tags[] }
 */
export async function classifyDocument(filename, mimeType, title = '') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are classifying academic documents for a student document management system.

Document info:
- Filename: "${filename}"
- Title: "${title || filename}"
- File type: "${mimeType}"

Classify this document and return ONLY valid JSON (no markdown, no explanation):
{
  "category": "<one of: marksheet | certificate | assignment | id_card | admission | fee_receipt | other>",
  "tags": ["<2-4 relevant tags, e.g. semester, subject, college, year>"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(text);

    // Validate category
    if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = 'other';
    if (!Array.isArray(parsed.tags)) parsed.tags = [];

    return parsed;
  } catch (err) {
    console.warn('AI classification failed, falling back to "other":', err.message);
    return { category: 'other', tags: [] };
  }
}

/**
 * Uses Gemini to summarize text extracted from a document.
 * Returns a markdown bullet-point summary string.
 */
export async function summarizeText(text, title = '') {
  if (!text || text.trim().length < 50) {
    throw new Error('Not enough text to summarize');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Truncate to ~4000 chars to stay well within token limits
  const truncated = text.slice(0, 4000);

  const prompt = `Summarize the following student document titled "${title}" in exactly 5 concise bullet points. 
Use plain language. Each bullet should be a single sentence.
Return ONLY the 5 bullet points starting with "• ", no intro, no conclusion.

Document text:
---
${truncated}
---`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
