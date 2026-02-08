
export enum ClimateZone {
  H1 = 'H1', // North, East, Center (Cold)
  H2 = 'H2', // West (Oceanic)
  H3 = 'H3'  // South (Mediterranean)
}

export interface Department {
  code: string;
  name: string;
  zone: ClimateZone;
}

export type HeatingMode = 'fioul' | 'gaz';

export interface SimulationParams {
  address: string;
  departmentCode: string;
  lat?: number;
  lng?: number;
  surface: number;
  isolation: 'mauvaise' | 'moyenne' | 'bonne';
  heatingMode: HeatingMode;
  currentAnnualSpending: number; // En Euros (€/an)
  occupants: number;
  customInvestment?: number;
  customSubsidies?: number;
}

export interface SimulationResult {
  currentAnnualCost: number;
  pacAnnualCost: number;
  annualSavings: number;
  co2Saved: number;
  estimatedInvestment: number;
  estimatedSubsidies: number;
  netInvestment: number;
  roiYears: number;
  currentKwh: number;
  pacKwh: number;
}
