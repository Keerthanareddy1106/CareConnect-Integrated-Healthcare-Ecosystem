import { GoogleGenAI as AIClient } from "@google/genai";

const ai = new AIClient({
  apiKey: import.meta.env.VITE_APP_API_KEY
});



export async function getSymptomAdvice(symptoms: string) {
  try {
    const response = await ai.models.generateContent({
      model: "fast-clinical-text-model",
      contents: `
You are a professional medical triage assistant.

A user reports the following reminder: "${symptoms}"

Structure your response:
### 🩺 Clinical Triage Advice
1. **Urgency Level**: (Stable / Needs Monitoring / Immediate Visit)
2. **Recommended Specialist**
3. **Immediate Care**: 2–3 bullet points
4. **Suggested Labs**: Choose from (CBC, Lipid Profile, HbA1c, Liver Function)

Always end with:
"Disclaimer: This is AI-generated triage and not a professional medical diagnosis."
`,
      config: {
        systemInstruction:
          "You are a calm, empathetic clinical assistant. Provide triage only, never a final diagnosis."
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Unable to process symptoms right now. Please consult a doctor.";
  }
}

export async function generateDigitalPrescription(
  symptoms: string,
  doctorName: string,
  specialization: string
) {
  try {
    const response = await ai.models.generateContent({
      model: "fast-clinical-text-model",
      contents: `
Generate a professional digital prescription.

Symptoms: "${symptoms}"
Doctor: ${doctorName} (${specialization})

Return JSON with:
- diagnosis
- medicines [{ name, dosage, duration, instructions }]
- lifestyleAdvice
- followUp
`,
      config: {
        responseMimeType: "application/json",
        systemInstruction:
          "You are a senior physician generating structured clinical records."
      }
    });

    return JSON.parse(response.text);
  }  catch (error) {
    console.error("AI Service Error:", error);
    return {
      diagnosis: "Acute Viral Syndrome",
      medicines: [
        {
          name: "Paracetamol 500mg",
          dosage: "1-0-1",
          duration: "3 days",
          instructions: "After meals"
        }
      ],
      lifestyleAdvice: "Adequate rest and hydration",
      followUp: "Consult a doctor if symptoms persist beyond 3 days"
    };
  }
}   // ✅ THIS CLOSING BRACE WAS MISSING
