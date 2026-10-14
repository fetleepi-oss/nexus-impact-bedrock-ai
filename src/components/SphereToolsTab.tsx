/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calculator,
  Droplets,
  Home,
  HeartPulse,
  Truck,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Users
} from 'lucide-react';
import { saveKnowledgeItem } from '../knowledgeBase';

interface SphereToolsTabProps {
  onLaunchHumanitarianWithParams: (population: string, calculatedSummary: string) => void;
  onSavedToKnowledgeBase?: () => void;
}

export const SphereToolsTab: React.FC<SphereToolsTabProps> = ({
  onLaunchHumanitarianWithParams,
  onSavedToKnowledgeBase
}) => {
  const [popInput, setPopInput] = useState<string>('18000');
  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  const POP_PRESETS = [
    { label: '5,000 (Small Camp)', val: '5000' },
    { label: '12,000 (Sub-District)', val: '12000' },
    { label: '18,000 (Somalia Flood)', val: '18000' },
    { label: '35,000 (Transit Hub)', val: '35000' },
    { label: '60,000 (Major Outflow)', val: '60000' },
  ];

  const popNum = Math.max(1, parseInt(popInput.replace(/,/g, ''), 10) || 0);
  const hhs = Math.round(popNum / 6);

  // Sphere calculations
  const waterPerDayLiters = popNum * 15;
  const waterTruckTrips = Math.ceil(waterPerDayLiters / 15000);
  const latrinesNeeded = Math.ceil(popNum / 20);
  const femaleLatrines = Math.round(latrinesNeeded * 0.75);
  const maleLatrines = latrinesNeeded - femaleLatrines;
  const shelterM2 = popNum * 3.5;
  const tarpsNeeded = hhs * 2;
  const blanketsNeeded = popNum * 2;
  const food30DayMT = ((popNum * 2100 * 0.00045) / 1000 * 30).toFixed(1);
  const samRutfSachets = Math.round(popNum * 0.04 * 150);
  const warehouseM2 = Math.round(popNum * 0.075 * 1.5);
  const trucksNeeded = Math.max(2, Math.ceil(popNum / 3500));
  const cdpsNeeded = Math.max(1, Math.ceil(popNum / 5000));

  const calculatedSummary = `Sphere Standards Allocation for ${popNum.toLocaleString()} individuals (~${hhs.toLocaleString()} households):
- Potable Water: ${waterPerDayLiters.toLocaleString()} L/day (${waterTruckTrips} x 15,000L tanker trips/day)
- Latrines: ${latrinesNeeded.toLocaleString()} stalls (${femaleLatrines} female, ${maleLatrines} male)
- Shelter Area: ${shelterM2.toLocaleString()} m² (${tarpsNeeded.toLocaleString()} reinforced tarpaulins)
- Nutrition: ~${food30DayMT} Metric Tons/30 days (2,100 kcal baseline) | SAM RUTF Buffer: ${samRutfSachets.toLocaleString()} sachets
- Logistics: ${warehouseM2.toLocaleString()} m² dry storage | ${trucksNeeded} x 10MT haulage trucks | ${cdpsNeeded} CDPs`;

  const handleCopySummary = () => {
    navigator.clipboard.writeText(calculatedSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToKb = () => {
    saveKnowledgeItem({
      agentId: 'metrics_registry',
      agentName: 'Sphere Emergency Calculator',
      itemType: 'metric',
      title: `Sphere Standard Allocation Profile (${popNum.toLocaleString()} Individuals)`,
      prompt: `Calculated humanitarian minimum standards for ${popNum.toLocaleString()} affected individuals.`,
      content: calculatedSummary,
      tags: ['SphereStandards', 'WASH', 'Shelter', 'Nutrition', 'Logistics', 'CalculatedMetrics'],
      metrics: [
        { label: 'Water (15L/day)', value: waterPerDayLiters.toLocaleString(), unit: 'L/day' },
        { label: 'Latrines (1:20)', value: latrinesNeeded.toLocaleString(), unit: 'stalls' },
        { label: 'Shelter Space', value: shelterM2.toLocaleString(), unit: 'm²' },
        { label: 'Food Basket', value: food30DayMT, unit: 'MT/30d' },
        { label: 'Truck Fleet', value: trucksNeeded.toString(), unit: 'trucks' }
      ]
    });
    setSaved(true);
    if (onSavedToKnowledgeBase) onSavedToKnowledgeBase();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="pb-28 pt-1 max-w-md w-full mx-auto space-y-3.5">
      {/* Header */}
      <div className="space-y-1 px-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-200 text-[10px] font-bold font-mono">
          <Calculator className="w-3 h-3 text-teal-400" aria-hidden="true" />
          <span>Productivity Accelerator</span>
        </div>
        <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
          <span>Rapid Sphere Emergency Calculator</span>
        </h1>
        <p className="text-xs text-slate-200 leading-relaxed">
          Instantly compute Sphere Standard humanitarian requirements across WASH, shelter, food security, and logistics.
        </p>
      </div>

      {/* Input Card */}
      <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 shadow-sm space-y-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              <span>Target Affected Population:</span>
            </span>
            <span className="text-[10px] font-mono text-teal-200 font-bold">
              ~{hhs.toLocaleString()} Households (Avg 6/HH)
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={popInput}
              onChange={(e) => setPopInput(e.target.value)}
              placeholder="18000"
              className="w-full p-3 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-base font-bold text-white tracking-wide font-mono pl-3 pr-24"
            />
            <span className="absolute right-3 top-3.5 text-xs text-slate-300 font-semibold pointer-events-none">
              individuals
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-slate-300 uppercase block font-bold">Quick Presets:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {POP_PRESETS.map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => setPopInput(p.val)}
                className={`min-h-[38px] px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  popInput === p.val
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'bg-[#0B132B] text-slate-200 hover:text-white border border-[#2E3C62]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculated Results Grid */}
      <div className="space-y-3">
        {/* Sector 1: WASH */}
        <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#2E3C62] pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#0B132B] border border-[#2E3C62]">
                <Droplets className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              </div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Water, Sanitation &amp; Hygiene (WASH)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">Sphere 15L/p/d</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] space-y-0.5">
              <span className="text-[10px] text-slate-300 font-mono block">Potable Water / Day</span>
              <div className="text-sm font-extrabold text-cyan-300 font-mono">
                {waterPerDayLiters.toLocaleString()} L
              </div>
              <span className="text-[10px] text-slate-400">
                {waterTruckTrips} x 15kL tanker trips/day
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] space-y-0.5">
              <span className="text-[10px] text-slate-300 font-mono block">Latrine Stalls (1:20)</span>
              <div className="text-sm font-extrabold text-cyan-300 font-mono">
                {latrinesNeeded.toLocaleString()} stalls
              </div>
              <span className="text-[10px] text-slate-400">
                {femaleLatrines} female (3:1) / {maleLatrines} male
              </span>
            </div>
          </div>
        </div>

        {/* Sector 2: Shelter & NFI */}
        <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#2E3C62] pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#0B132B] border border-[#2E3C62]">
                <Home className="w-4 h-4 text-amber-400" aria-hidden="true" />
              </div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Shelter &amp; Non-Food Items (NFI)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-amber-300 font-bold">Sphere 3.5 m²/p</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] space-y-0.5">
              <span className="text-[10px] text-slate-300 font-mono block">Covered Space Area</span>
              <div className="text-sm font-extrabold text-amber-300 font-mono">
                {shelterM2.toLocaleString()} m²
              </div>
              <span className="text-[10px] text-slate-400">
                {tarpsNeeded.toLocaleString()} heavy tarps (2/HH)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] space-y-0.5">
              <span className="text-[10px] text-slate-300 font-mono block">Thermal Blankets</span>
              <div className="text-sm font-extrabold text-amber-300 font-mono">
                {blanketsNeeded.toLocaleString()} blankets
              </div>
              <span className="text-[10px] text-slate-400">
                2 blankets per person minimum
              </span>
            </div>
          </div>
        </div>

        {/* Sector 3: Nutrition & Food Security */}
        <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#2E3C62] pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#0B132B] border border-[#2E3C62]">
                <HeartPulse className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              </div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Emergency Nutrition &amp; Rations
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 font-bold">Sphere 2,100 kcal</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] space-y-0.5">
              <span className="text-[10px] text-slate-300 font-mono block">30-Day Ration Volume</span>
              <div className="text-sm font-extrabold text-emerald-300 font-mono">
                ~{food30DayMT} MT
              </div>
              <span className="text-[10px] text-slate-400">
                Fortified cereals, pulses, oil
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] space-y-0.5">
              <span className="text-[10px] text-slate-300 font-mono block">SAM RUTF Sachets</span>
              <div className="text-sm font-extrabold text-emerald-300 font-mono">
                {samRutfSachets.toLocaleString()} sachets
              </div>
              <span className="text-[10px] text-slate-400">
                Buffer for 4% GAM rate in &lt;5s
              </span>
            </div>
          </div>
        </div>

        {/* Sector 4: Relief Logistics */}
        <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#2E3C62] pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#0B132B] border border-[#2E3C62]">
                <Truck className="w-4 h-4 text-teal-400" aria-hidden="true" />
              </div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Relief Logistics &amp; Staging
              </h2>
            </div>
            <span className="text-[10px] font-mono text-teal-300 font-bold">Cluster Staging</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-[#0B132B] border border-[#2E3C62] space-y-0.5 text-center">
              <span className="text-[9px] text-slate-300 font-mono block">Warehouse</span>
              <div className="text-xs font-extrabold text-teal-300 font-mono">
                {warehouseM2.toLocaleString()} m²
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#0B132B] border border-[#2E3C62] space-y-0.5 text-center">
              <span className="text-[9px] text-slate-300 font-mono block">Truck Fleet</span>
              <div className="text-xs font-extrabold text-teal-300 font-mono">
                {trucksNeeded} x 10MT
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#0B132B] border border-[#2E3C62] space-y-0.5 text-center">
              <span className="text-[9px] text-slate-300 font-mono block">Dist. Points</span>
              <div className="text-xs font-extrabold text-teal-300 font-mono">
                {cdpsNeeded} CDPs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => onLaunchHumanitarianWithParams(`${popNum.toLocaleString()} individuals (~${hhs.toLocaleString()} households)`, calculatedSummary)}
          className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-[#14B8A6] hover:from-teal-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>Transfer Numbers to Humanitarian Agent</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="min-h-[44px] p-2.5 rounded-xl bg-[#1C2541] hover:bg-[#2E3C62] border border-[#2E3C62] text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-teal-300" />
                <span className="text-teal-200">Copied Allocations</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Allocations</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleSaveToKb}
            className="min-h-[44px] p-2.5 rounded-xl bg-[#1C2541] hover:bg-[#2E3C62] border border-[#2E3C62] text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {saved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-teal-300" />
                <span className="text-teal-200">Saved to KB</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save to Knowledge Base</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
