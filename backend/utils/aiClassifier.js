import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Uses Gemini Flash to classify a student document by filename + mimeType.
 * Returns { category, tags[] }
 */
export async function classifyDocument(filename, mimeType, title = '') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are classifying academic and personal documents for a student document management system.

Document info:
- Filename: "${filename}"
- Title: "${title || filename}"
- File type: "${mimeType}"

Tasks:
1. Determine the best category for this document. Use common ones like "Marksheet", "Certificate", "Assignment", "ID Card", "Fee Receipt", "Admission" if they fit.
2. If it doesn't fit the common ones, SUGGEST a new concise category name (e.g. "Admit Card", "Visa", "Internship Letter", "Recommendation").
3. Suggest 2-4 relevant tags.

Return ONLY valid JSON:
{
  "category": "Concise Category Name (Title Case)",
  "tags": ["tag1", "tag2"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(text);

    // Normalize category: ensure it's a string and not empty
    if (typeof parsed.category !== 'string' || !parsed.category.trim()) {
      parsed.category = 'Other';
    }
    
    // Title Case the category for consistency
    parsed.category = parsed.category.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    if (!Array.isArray(parsed.tags)) parsed.tags = [];

    return parsed;
  } catch (err) {
    console.warn('AI classification failed, falling back to "Other":', err.message);
    return { category: 'Other', tags: [] };
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
