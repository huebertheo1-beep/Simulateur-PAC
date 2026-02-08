
import { GoogleGenAI } from "@google/genai";
import { SimulationParams, SimulationResult } from "../types";

export const getExpertAdvice = async (params: SimulationParams, results: SimulationResult) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const heatingLabel = params.heatingMode === 'fioul' ? 'Fioul' : 'Gaz';
  
  const prompt = `
    En tant qu'expert en rénovation énergétique, analyse ce projet de remplacement d'une chaudière ${heatingLabel} par une pompe à chaleur (PAC).
    
    Données :
    - Adresse : ${params.address || 'France'}
    - Surface : ${params.surface} m²
    - Économie annuelle : ${results.annualSavings.toFixed(0)} €
    - Gain CO2 : ${results.co2Saved.toFixed(0)} kg/an
    - ROI : ${results.roiYears.toFixed(1)} ans
    - Auto-financement mensuel : ${((results.annualSavings / 12) - (results.netInvestment / 60)).toFixed(0)} €/mois (estimé sur 5 ans)

    Rédige un bilan TRÈS COURT (3-4 phrases maximum), extrêmement motivant et percutant. 
    L'objectif est de confirmer à l'utilisateur que c'est le moment idéal pour agir. 
    Souligne le bénéfice immédiat sur le confort et le portefeuille.
    Utilise un ton professionnel mais enthousiaste.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Votre projet présente un excellent potentiel d'économies. Le passage à la pompe à chaleur est une étape majeure pour valoriser votre patrimoine tout en réduisant vos factures.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Projet hautement pertinent : les économies générées couvrent une grande partie de l'investissement. C'est une opportunité idéale pour moderniser votre confort.";
  }
};
