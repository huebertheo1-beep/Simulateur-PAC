
import React, { useState, useMemo, useEffect } from 'react';
import { SimulationParams, SimulationResult, HeatingMode } from './types';
import { ENERGY_PRICES, PAC_SPECS, getZoneByCode } from './constants';
import { MapContainer } from './components/MapContainer';
import { AddressAutocomplete } from './components/AddressAutocomplete';

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    address: '',
    departmentCode: '75',
    lat: undefined,
    lng: undefined,
    surface: 100,
    isolation: 'moyenne',
    heatingMode: 'fioul',
    currentAnnualSpending: 2500,
    occupants: 3,
    customInvestment: 14000,
    customSubsidies: 4500,
  });

  // États pour la gestion de la simulation (Section Économies uniquement)
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);

  const [showFinancingSim, setShowFinancingSim] = useState(false);
  const [showLongTermProjection, setShowLongTermProjection] = useState(false);
  const [loanMonths, setLoanMonths] = useState(120);
  const [interestRate, setInterestRate] = useState(3.5);

  const loadingMessages = [
    "Recherche des données météo locales...",
    "Analyse de l'isolation thermique...",
    "Calcul de la puissance PAC nécessaire...",
    "Estimation des aides MaPrimeRénov'...",
    "Optimisation du retour sur investissement..."
  ];

  const results = useMemo((): SimulationResult => {
    const zone = getZoneByCode(params.departmentCode);
    const scop = PAC_SPECS[zone].SCOP;

    let currentEnergyNeededKwh = 0;
    const currentAnnualCost = params.currentAnnualSpending || 0;

    if (params.heatingMode === 'fioul') {
      const liters = currentAnnualCost / ENERGY_PRICES.OIL_LITER;
      currentEnergyNeededKwh = liters * ENERGY_PRICES.OIL_KWH_PER_LITER * ENERGY_PRICES.OIL_EFFICIENCY;
    } else {
      const gazKwh = currentAnnualCost / ENERGY_PRICES.GAZ_KWH;
      currentEnergyNeededKwh = gazKwh * ENERGY_PRICES.GAZ_EFFICIENCY;
    }

    const pacKwhNeeded = currentEnergyNeededKwh / scop;
    const pacAnnualCost = pacKwhNeeded * ENERGY_PRICES.ELEC_KWH;

    const annualSavings = Math.max(0, currentAnnualCost - pacAnnualCost);
    const investment = params.customInvestment ?? 0;
    const subsidies = params.customSubsidies ?? 0;
    const netInvestment = Math.max(0, investment - subsidies);
    
    const roiYears = (annualSavings > 0 && netInvestment > 0) ? netInvestment / annualSavings : 0;

    return {
      currentAnnualCost,
      pacAnnualCost,
      annualSavings,
      co2Saved: 0,
      estimatedInvestment: investment,
      estimatedSubsidies: subsidies,
      netInvestment,
      roiYears,
      currentKwh: currentEnergyNeededKwh,
      pacKwh: pacKwhNeeded
    };
  }, [params]);

  const monthlySavings = results.annualSavings / 12;
  
  // Calcul de la mensualité avec intérêts
  const monthlyLoanPayment = useMemo(() => {
    const P = results.netInvestment;
    const n = loanMonths;
    const r = (interestRate / 100) / 12;

    if (P === 0) return 0;
    if (r === 0) return P / n;
    
    return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [results.netInvestment, loanMonths, interestRate]);

  // Calcul 20 ans (avec inflation énergie estimée à 3%/an)
  const longTermData = useMemo(() => {
    const years = 20;
    const inflation = 0.03;
    let totalSavings = 0;
    let currentYearSavings = results.annualSavings;

    for (let i = 0; i < years; i++) {
      totalSavings += currentYearSavings;
      currentYearSavings *= (1 + inflation);
    }

    const totalLoanCost = monthlyLoanPayment * loanMonths;
    const net20YearGain = totalSavings - totalLoanCost;

    return {
      totalSavings,
      totalLoanCost,
      net20YearGain
    };
  }, [results.annualSavings, monthlyLoanPayment, loanMonths]);

  const netMonthlyBalance = monthlySavings - monthlyLoanPayment;
  const isSelfFinanced = netMonthlyBalance >= 0;

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setHasResults(false);
    setLoadingProgress(0);
    setLoadingStep(0);

    const duration = 4000 + Math.random() * 3000;
    const intervalTime = 50;
    const totalSteps = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = (currentStep / totalSteps) * 100;
      setLoadingProgress(progress);
      
      const messageIndex = Math.min(
        Math.floor((progress / 100) * loadingMessages.length),
        loadingMessages.length - 1
      );
      setLoadingStep(messageIndex);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setIsSimulating(false);
        setHasResults(true);
      }
    }, intervalTime);
  };

  const handleAddressChange = (address: string, deptCode: string, lat?: number, lng?: number) => {
    setParams(prev => ({ ...prev, address, departmentCode: deptCode || prev.departmentCode, lat, lng }));
    setHasResults(false);
  };

  const handleInputUpdate = (update: Partial<SimulationParams>) => {
    setParams(prev => ({ ...prev, ...update }));
    if ('heatingMode' in update || 'surface' in update || 'isolation' in update || 'currentAnnualSpending' in update) {
      setHasResults(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-emerald-600 text-white shadow-md py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="bg-white p-2 rounded-xl shadow-inner">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">EcoProjet</h1>
            <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Simulez vos futures économies</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-4 lg:p-8 flex flex-col gap-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          
          {/* COLONNE GAUCHE - CONFIGURATION */}
          <div className="flex flex-col gap-6 lg:gap-8">
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 text-sm">1</span>
                Localisation du bien
              </h2>
              <div className="space-y-6">
                <AddressAutocomplete value={params.address} onChange={handleAddressChange} />
                <MapContainer address={params.address} lat={params.lat} lng={params.lng} />
              </div>
            </section>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 text-sm">2</span>
                Étude technique
              </h2>
              <div className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mode de chauffage actuel</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner gap-1">
                    <button onClick={() => { handleInputUpdate({ heatingMode: 'fioul' }); }} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${params.heatingMode === 'fioul' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>🔥 Fioul</button>
                    <button onClick={() => { handleInputUpdate({ heatingMode: 'gaz' }); }} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${params.heatingMode === 'gaz' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>💨 Gaz</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Surface (m²)</label>
                    <input type="number" value={params.surface} onChange={(e) => handleInputUpdate({ surface: Number(e.target.value) })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Isolation</label>
                    <select value={params.isolation} onChange={(e) => handleInputUpdate({ isolation: e.target.value as any })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option value="mauvaise">Faible</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="bonne">Optimale</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Facture de chauffage annuel (€)</label>
                  <input type="number" value={params.currentAnnualSpending} onChange={(e) => handleInputUpdate({ currentAnnualSpending: Number(e.target.value) })} className="w-full p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-900 text-lg" />
                </div>
              </div>
            </section>
          </div>

          {/* COLONNE DROITE */}
          <div className="flex flex-col gap-6 lg:gap-8 min-h-[600px]">
            {isSimulating ? (
              <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center h-full">
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-600 font-black text-2xl">
                    {Math.round(loadingProgress)}%
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Simulation en cours</h3>
                <p className="text-slate-500 animate-pulse">{loadingMessages[loadingStep]}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 lg:gap-8">
                {/* SECTION ECONOMIES */}
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600 text-sm">3</span>
                    Analyse des économies
                  </h2>
                  
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-0">
                      <div className="flex-1 w-full bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center flex flex-col gap-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avant</p>
                        <p className="text-sm font-bold text-slate-600 mb-1 uppercase tracking-tighter">
                          {params.heatingMode === 'fioul' ? '🔥 Fioul' : '💨 Gaz'}
                        </p>
                        <div className="py-3 px-6 bg-red-100 rounded-xl border border-red-200">
                          <p className="text-2xl font-black text-red-600">{Math.round(results.currentAnnualCost).toLocaleString()} €/an</p>
                        </div>
                      </div>
                      <div className="z-10 -mx-3 bg-white p-2 rounded-full border border-slate-200 shadow-sm hidden md:block">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </div>
                      <div className="flex-1 w-full bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 text-center flex flex-col gap-2 shadow-sm">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Après</p>
                        <p className="text-sm font-bold text-emerald-700 mb-1 uppercase tracking-tighter">⚡ PAC</p>
                        <div className={`py-3 px-6 rounded-xl shadow-lg ${hasResults ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-200 shadow-none'}`}>
                          <p className={`text-2xl font-black ${hasResults ? 'text-white' : 'text-slate-500'}`}>
                            {hasResults ? `${Math.round(results.pacAnnualCost).toLocaleString()} €/an` : '?'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-8 text-white text-center relative overflow-hidden shadow-xl">
                      <p className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Économie annuelle</p>
                      <p className="text-6xl font-black mb-4 tracking-tight">
                        {hasResults ? `+${Math.round(results.annualSavings).toLocaleString()} €` : '?'}
                      </p>
                      <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
                        <span className="text-xl font-black text-emerald-400">
                          {hasResults ? `${Math.round(monthlySavings).toLocaleString()} €` : '?'}
                        </span>
                        <span className="text-slate-400 text-sm font-medium uppercase tracking-widest">/ mois</span>
                      </div>
                    </div>

                    {!hasResults && (
                      <button onClick={handleStartSimulation} className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-emerald-200 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 animate-pulse">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Lancer la simulation
                      </button>
                    )}
                  </div>
                </section>

                {/* SECTION FINANCEMENT - Affiche seulement si hasResults est vrai */}
                {hasResults && (
                  <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm">4</span>
                      Étude financière
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-700">Investissement (€)</label>
                          <input type="number" value={params.customInvestment} onChange={(e) => handleInputUpdate({ customInvestment: Number(e.target.value) || 0 })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-700">Total Aides (€)</label>
                          <input type="number" value={params.customSubsidies} onChange={(e) => handleInputUpdate({ customSubsidies: Number(e.target.value) || 0 })} className="w-full p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                      </div>

                      <div className="p-5 bg-slate-900 rounded-2xl flex items-center justify-center text-center shadow-md">
                        <div>
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Reste à financer</p>
                          <p className="text-3xl font-black text-white">{results.netInvestment.toLocaleString()} €</p>
                        </div>
                      </div>

                      <button onClick={() => setShowFinancingSim(!showFinancingSim)} className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl transition-all border border-slate-200 flex items-center justify-center gap-2">
                        <svg className={`w-5 h-5 transition-transform ${showFinancingSim ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        Simulation de financement
                      </button>

                      {showFinancingSim && (
                        <div className="p-6 bg-blue-50/40 rounded-3xl border border-blue-100 space-y-8 animate-in slide-in-from-top-4 duration-300">
                          {/* Contrôles de simulation */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-600 uppercase">Durée du prêt</label>
                                <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{loanMonths} mois</span>
                              </div>
                              <input type="range" min="12" max="180" step="12" value={loanMonths} onChange={(e) => setLoanMonths(Number(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-600 uppercase">Taux d'intérêt</label>
                                <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{interestRate.toFixed(2)} %</span>
                              </div>
                              <input type="range" min="0" max="10" step="0.05" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            </div>
                          </div>

                          {/* Comparatif Simplifié & Explicite */}
                          <div className="pt-6 border-t border-blue-100">
                            <div className="flex flex-col items-center gap-6">
                              <h4 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Bilan Mensuel</h4>
                              
                              <div className="w-full grid grid-cols-2 gap-3">
                                {/* Bloc Économies */}
                                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center">
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Économies</p>
                                  <p className="text-xl font-black text-emerald-700">+{hasResults ? Math.round(monthlySavings) : '?'} €</p>
                                </div>

                                {/* Bloc Mensualité */}
                                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-center">
                                  <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Mensualité</p>
                                  <p className="text-xl font-black text-red-700">-{Math.round(monthlyLoanPayment)} €</p>
                                </div>
                              </div>

                              {/* Résultat Central Ergonomique */}
                              <div className={`w-full p-8 rounded-[2rem] border-2 transition-all duration-500 shadow-2xl relative overflow-hidden ${isSelfFinanced ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-200' : 'bg-slate-900 border-slate-700 text-white'}`}>
                                {/* Decorative background element for self-financed */}
                                {isSelfFinanced && (
                                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                                )}
                                
                                <div className="flex flex-col items-center text-center relative z-10">
                                  {isSelfFinanced ? (
                                    <>
                                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-5 backdrop-blur-md border border-white/30 shadow-inner">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                      <p className="text-lg font-black uppercase tracking-normal mb-0 whitespace-nowrap">Opération rentable</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-60">Reste à charge Mensuel</p>
                                      <p className="text-6xl font-black tracking-tighter mb-4">
                                        {hasResults ? `${Math.abs(Math.round(netMonthlyBalance)).toLocaleString()} €` : '?'}
                                      </p>
                                      {hasResults && (
                                        <div className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold mt-2 shadow-sm">
                                          ⚡ Financement Partiel
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* BOUTON PROJECTION 20 ANS */}
                              <button 
                                onClick={() => setShowLongTermProjection(!showLongTermProjection)} 
                                className={`w-full py-4 font-bold rounded-2xl transition-all border flex items-center justify-center gap-2 mt-4 shadow-sm ${showLongTermProjection ? 'bg-amber-600 text-white border-amber-500' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                              >
                                <svg className={`w-5 h-5 transition-transform ${showLongTermProjection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                {showLongTermProjection ? 'Masquer le bilan' : 'Bilan sur 20 ans'}
                              </button>

                              {/* Message explicatif final (si non auto-financé) */}
                              {hasResults && !isSelfFinanced && !showLongTermProjection && (
                                <p className="text-sm text-center text-slate-500 font-medium px-6 leading-relaxed bg-slate-50 py-3 rounded-2xl border border-slate-100 mt-4">
                                  Votre investissement ne coûte que <span className="text-slate-900 font-bold">{Math.abs(Math.round(netMonthlyBalance))} €</span> par mois après déduction des économies d'énergie.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* AFFICHAGE DE LA PROJECTION À L'INTÉRIEUR DU BLOC FINANCEMENT */}
                          {showLongTermProjection && (
                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-500 mt-6 relative overflow-hidden">
                              {/* Background highlight */}
                              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                              
                              <div className="flex items-center justify-between mb-8 relative z-10">
                                 <div>
                                   <h3 className="text-xl font-black tracking-tight">Bilan sur 20 ans</h3>
                                 </div>
                                 <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                 </div>
                              </div>

                              <div className="space-y-8 relative z-10">
                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Économies cumulées</span>
                                    <span className="text-2xl font-black text-emerald-400">+{Math.round(longTermData.totalSavings).toLocaleString()} €</span>
                                  </div>
                                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                                  </div>
                                  <p className="text-[10px] text-slate-500 italic mt-1">* En incluant une inflation de l'énergie de 3% / an</p>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Investissement avec Financement</span>
                                    <span className="text-xl font-bold text-red-400">-{Math.round(longTermData.totalLoanCost).toLocaleString()} €</span>
                                  </div>
                                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (longTermData.totalLoanCost / longTermData.totalSavings) * 100)}%` }}></div>
                                  </div>
                                  <p className="text-[10px] text-slate-500 italic mt-1">* Coût total des mensualités sur {loanMonths} mois</p>
                                </div>

                                <div className="pt-8 border-t border-white/10">
                                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center">
                                    <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-3">GAIN NET SUR 20 ANS</p>
                                    <p className="text-5xl font-black text-white tracking-tighter">
                                      {Math.round(longTermData.net20YearGain).toLocaleString()} €
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto py-10 px-4 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">© 2025 EcoProjet — Simulateur Éducatif — Données basées sur les moyennes nationales</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
