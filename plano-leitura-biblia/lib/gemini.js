// Chamada ao Gemini com resposta em JSON estruturado (somente no servidor)
import { GoogleGenAI, Type } from "@google/genai";

export const MODELO = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const S = { type: Type.STRING };
export const lista = (items) => ({ type: Type.ARRAY, items });
export const obj = (properties) => ({ type: Type.OBJECT, properties, required: Object.keys(properties) });

export async function gerarJSON(prompt, schema, temperature = 0.4) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const resp = await ai.models.generateContent({
    model: MODELO,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema, temperature },
  });
  return JSON.parse(resp.text);
}
