
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getSymptomAdvice(symptoms: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional medical triage assistant. A user reports the following symptoms: "${symptoms}". 
      
      Structure your response:
      ### 🩺 Clinical Triage Advice
      1. **Urgency Level**: (Stable / Needs Monitoring / Immediate Visit)
      2. **Recommended Specialist**: (e.g. Cardiologist, General Physician)
      3. **Immediate Care**: 2-3 bullet points of non-diagnostic advice.
      4. **Suggested Labs**: Recommend a relevant test from (CBC, Lipid Profile, HbA1c, or Liver Function).
      
      Always end with: "*Disclaimer: This is AI-generated triage and not a professional medical diagnosis. Please consult a doctor.*"`,
      config: {
        systemInstruction: "You are a professional clinical assistant. Your tone is calm, empathetic, and clinical. You provide triage, never a final diagnosis."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to process symptoms at the moment. For emergencies, please call 102 or visit the nearest ER.";
  }
}

export async function generateDigitalPrescription(symptoms: string, doctorName: string, specialization: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional clinical digital prescription for a patient who reported: "${symptoms}". 
      The treating specialist is ${doctorName} (${specialization}).
      
      The output must be JSON with:
      - "diagnosis": A realistic medical diagnosis string.
      - "medicines": Array of {name, dosage, duration, instructions}.
      - "lifestyleAdvice": Detailed advice.
      - "followUp": When to see the doctor again.`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are a senior physician generating clinical records. Use realistic pharmaceutical names and standard clinical dosages."
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Prescription Gen Error:", error);
    return {
      diagnosis: "Acute Viral Syndrome",
      medicines: [{ name: "Paracetamol 500mg", dosage: "1-0-1", duration: "3 Days", instructions: "After meals" }],
      lifestyleAdvice: "Ensure 3 liters of hydration and complete rest.",
      followUp: "In 3 days if fever persists."
    };
  }
}
