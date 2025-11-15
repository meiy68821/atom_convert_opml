import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  console.warn('Gemini API key not set. Please check .env.local configuration!');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function convertAtomToOpml(atomContent: string): Promise<string> {
  const model = 'gemini-2.5-flash';
  const cleanContent = atomContent.replace(/<entry[\s\S]*?<\/entry>/g, '');
  const prompt = `
    You are an expert XML format converter. Convert the Atom feed XML below into OPML 1.0 format.
    Only output valid OPML XML (no comments, no markdown). Atom to convert:
    \`\`\`xml
    ${cleanContent}
    \`\`\`
  `;
  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    let text = response.text?.trim() ?? '';
    if (text.startsWith('```
    else if (text.startsWith('```')) text = text.substring(3);
    if (text.endsWith('```
    return text.trim();
  } catch (err) {
    console.error('Gemini convert error:', err);
    throw new Error('转换 Atom 为 OPML 失败，请检查 API 或输入格式');
  }
}
