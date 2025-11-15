
import { GoogleGenAI } from "@google/genai";

// This check is for robust handling in environments where process.env might not be defined.
// In the target runtime, process.env.API_KEY is assumed to be available.
const API_KEY = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

if (!API_KEY) {
    // In a real app, you might want to show a graceful error to the user.
    // For this context, we assume the key is always provided by the environment.
    console.warn("API_KEY environment variable not set. The application will not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY as string });

export const convertAtomToOpml = async (atomContent: string): Promise<string> => {
    const model = 'gemini-2.5-flash';

    // Pre-process the Atom content to remove all <entry> tags to reduce token count.
    // The entries are not needed for this conversion, only the feed's header.
    const preprocessedAtomContent = atomContent.replace(/<entry[\s\S]*?<\/entry>/g, '');
    
    const prompt = `
You are an expert XML format converter. Your sole task is to convert the provided Atom feed XML into OPML version 1.0 format.

**Conversion Rules:**
1.  The OPML file must start with \`<?xml version="1.0" encoding="UTF-8"?>\`.
2.  The root element must be \`<opml version="1.0">\`.
3.  It must contain a \`<head>\` section with a \`<title>\`. Use the Atom feed's title for the OPML title.
4.  It must contain a \`<body>\` section.
5.  Inside the body, create a single \`<outline ... />\` element for the feed.
6.  The \`text\` and \`title\` attributes of the outline element should be the Atom feed's title.
7.  The \`xmlUrl\` attribute of the outline element should be the feed's self-link URL (usually found in a \`link\` tag with \`rel='self'\`).
8.  The \`type\` attribute should be "rss".
9.  Do not include any explanation, comments, or extra text outside of the final OPML XML structure. The output must be only the valid OPML XML.

**Atom XML to convert:**
\`\`\`xml
${preprocessedAtomContent}
\`\`\`
`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        
        let opmlText = response.text;

        // Clean up potential markdown code block fences from the response
        if (opmlText.startsWith("```xml")) {
            opmlText = opmlText.substring(7);
        } else if (opmlText.startsWith("```")) {
            opmlText = opmlText.substring(3);
        }
        
        if (opmlText.endsWith("```")) {
            opmlText = opmlText.slice(0, -3);
        }

        return opmlText.trim();
    } catch (error) {
        console.error("Error converting Atom to OPML:", error);
        throw new Error("Failed to convert the Atom feed using the Gemini API.");
    }
};
