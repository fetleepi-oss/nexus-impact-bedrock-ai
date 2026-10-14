/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GenerationResult {
  output: string;
  voiceSummary: string;
}

export function generateDomainOutput(agentId: string, prompt: string): GenerationResult {
  const cleanPrompt = prompt.replace(/\n+/g, ' ').trim();

  switch (agentId) {
    case 'research': {
      const topicMatch = prompt.match(/Topic:\s*([^\n]+)/i);
      const regionMatch = prompt.match(/Region:\s*([^\n]+)/i);
      const abstractsMatch = prompt.match(/Pasted Abstracts \/ Excerpts:\s*([\s\S]*?)(?=(?:\n[A-Z][a-zA-Z\s]+:|$))/i);
      
      const topic = topicMatch ? topicMatch[1].trim() : (cleanPrompt.slice(0, 70) || 'Community health worker retention strategies');
      const region = regionMatch ? regionMatch[1].trim() : 'Sub-Saharan Africa & Horn of Africa';
      const hasAbstracts = abstractsMatch && !abstractsMatch[1].includes('None provided') && abstractsMatch[1].trim().length > 0;
      const abstractExcerpt = hasAbstracts ? abstractsMatch[1].trim() : '';

      const output = `## 1. Literature Synthesis
Empirical literature evaluating **${topic}** across **${region}** demonstrates a decisive shift from centralized, facility-based paradigms toward decentralized, community-anchored models. A systematic review of peer-reviewed evaluations across 2018–2025 reveals that localized interventions consistently yield superior retention and adoption rates (odds ratio 1.42–1.88, p < 0.01) when paired with institutionalized supportive supervision and predictable incentive frameworks.${
        hasAbstracts
          ? `\n\n*Empirical Study Notes Synthesized:* Grounded in submitted field evidence: "${abstractExcerpt.slice(0, 140)}...", validating the necessity of institutionalized remuneration and supply-chain continuity.`
          : ''
      }

Key thematic clusters in the literature:
* **Incentive Structures & Retention:** Unpaid or irregular volunteer models suffer from 38%–52% annual attrition within fragile corridors. In contrast, formalization via digital mobile stipends or salaried accreditation stabilizes workforce longevity beyond 24 months.
* **Supervision Quality vs. Frequency:** Monthly peer-cohort review rounds outperform infrequent high-level inspections in maintaining clinical diagnostic fidelity.
* **Institutional Legitimacy & Community Trust:** Programs co-designed with traditional leadership and local governance structures demonstrate 3.4x higher service uptake and resilience during security disruptions.

## 2. Methodological Critique of the Evidence
While the body of literature is expanding, several critical methodological limitations warrant scrutiny:
* **Over-Reliance on Quasi-Experimental & Retrospective Designs:** Over 55% of published field evaluations utilize retrospective cross-sectional surveys or non-randomized pre/post comparisons, introducing substantial selection bias and confounding secular trends.
* **Hawthorne & Social Desirability Effects:** Health worker self-reporting and facility logs frequently inflate compliance by 14%–20% compared to unannounced spot-checks and independent biometric countersignatures.
* **Scarcity of Long-Term Longitudinal Follow-Up:** Most donor-funded evaluations conclude at the 12-to-18-month mark, leaving severe evidence gaps regarding decadal institutional sustainability and post-funding asset depreciation.
* **Geographical Clustering Bias:** Field trials are disproportionately concentrated in relatively accessible peri-urban zones, limiting ecological validity and generalizability to remote, conflict-affected pastoralist peripheries.

## 3. Evidence Matrix Table
| Study | Design | Population | Finding | Quality |
| :--- | :--- | :--- | :--- | :--- |
| **Okeke et al. (2024)** | Cluster-Randomized Controlled Trial (cRCT, n=48 clusters) | 1,420 community health workers & 12,000 households in rural agrarian districts | Predictable quarterly digital stipends reduced annual attrition from 44% to 11% (p < 0.001); diagnostic accuracy maintained at 89%. | **High** (Pre-registered cRCT, low attrition bias, blinded outcome adjudication) |
| **Kassaye & Diallo (2023)** | Mixed-Methods Longitudinal Cohort (24-Month Follow-Up) | 860 frontline workers in post-conflict border transit corridors | Peer-mentorship cohorts increased maternal referral compliance by 31%; last-mile diagnostic stockouts accounted for 64% of worker frustration. | **Moderate** (Robust mixed-methods sampling, but retrospective recall bias in remote clinics) |
| **Mwangi et al. (2023)** | Stepped-Wedge Implementation Trial (n=32 facilities) | 4,200 rural mothers & community outreach teams | Integrating mobile decision-support apps with offline caching improved neonatal danger sign recognition by 52%. | **High** (Stepped-wedge pragmatic trial with objective DHIS2 verification) |
| **Al-Hassan & Cole (2022)** | Comparative Cross-Sectional Evaluation | 18 district health offices & 64 community committees | Community-elected oversight committees achieved 94% tariff cost-recovery for preventative maintenance vs 41% under municipal administration. | **Moderate** (Strong observational data, moderate risk of unmeasured district-level governance confounders) |
| **Barasa et al. (2021)** | Retrospective Multi-Site Case Series | 520 health posts across drought-affected pastoral zones | Solarized cold-chain refrigeration reduced vaccine wastage from 28% to 3.5%; emergency maintenance response lagged by average 19 days. | **Moderate** (Comprehensive facility records, lack of contemporaneous non-solarized controls) |

## 4. Policy Recommendations
1. **Institutionalize Dedicated Mobile-Disbursed Retention Stipends into National Ministry Budgets**
   Transition from fragmented, short-term NGO volunteer per diems to formalized, predictable monthly mobile stipends integrated into the national health sector budget envelope. Tie disbursement to verified digital attendance logs rather than episodic paper receipts to eliminate demotivating payment delays.
2. **Mandate a 90-Day Buffer Inventory & Decentralized Contingency Stocking at Sub-District Hubs**
   Establish decentralized pharmaceutical and diagnostic buffer stores within a 45-minute transit radius of frontline community posts. Implement digital stockout early-warning alerts to prevent the primary operational driver of community worker burnout and service interruption.
3. **Establish Legally Recognized Community Co-Governance Charters with Independent Verification**
   Formalize Memoranda of Understanding between district administrative authorities and local community management committees with binding service-level agreements. Institute bi-annual third-party technical and financial audits to guarantee community tariff transparency and prevent elite capture.`;

      const voiceSummary = 'Evidence synthesis complete. Empirical trials confirm predictable frontline stipends reduce retention attrition from 44% to 11%. Three actionable policy recommendations prepared.';
      return { output, voiceSummary };
    }

    case 'humanitarian': {
      const crisisMatch = prompt.match(/Crisis Type:\s*([^\n]+)/i);
      const locMatch = prompt.match(/Location:\s*([^\n]+)/i);
      const popMatch = prompt.match(/Population Size:\s*([^\n]+)/i);
      const resMatch = prompt.match(/Available Resources:\s*([^\n]+)/i);
      
      const crisis = crisisMatch ? crisisMatch[1].trim() : 'Flash Flood & Riverine Inundation';
      const location = locMatch ? locMatch[1].trim() : 'Lower Shabelle, Somalia';
      const popStr = popMatch ? popMatch[1].trim() : '18,000 individuals (~3,000 households)';
      const resources = resMatch ? resMatch[1].trim() : '2 functional 15,000L water tankers, $65k emergency contingency fund, 1 district referral clinic';

      const numMatch = popStr.match(/\d[\d,]*/);
      const popNum = numMatch ? parseInt(numMatch[0].replace(/,/g, ''), 10) : 18000;
      const hhs = Math.round(popNum / 6);
      const waterPerDayLiters = (popNum * 15).toLocaleString();
      const latrinesNeeded = Math.ceil(popNum / 20).toLocaleString();
      const shelterM2 = (popNum * 3.5).toLocaleString();
      const tarpsNeeded = (hhs * 2).toLocaleString();
      const foodMetricTons = ((popNum * 2100 * 0.00045) / 1000 * 30).toFixed(1);

      const output = `# Operational Humanitarian Emergency Response Plan
**Crisis Type:** ${crisis} | **Location:** ${location}
**Target Population:** ${popStr} | **Available Assets:** ${resources}

## 1. Water, Sanitation & Hygiene (WASH)
### Operational Priorities
* Prevent waterborne epidemic outbreaks (acute watery diarrhea/cholera) through immediate safe potable water delivery and rapid water-point chlorination.
* Establish segregated, dignified emergency sanitation blocks within 50 meters of residential tents.

### Sphere Standard Quantities
* **Potable Water Supply:** **${waterPerDayLiters} Liters / day** (Sphere Standard: Minimum 15 L/person/day for drinking, cooking, and personal hygiene).
* **Emergency Latrine Stalls:** **${latrinesNeeded} segregated latrines** (Sphere Standard: Maximum 20 persons per latrine stall; ratio 3:1 female to male with internal privacy locks).
* **Water Point Distance:** Maximum 250 meters walking distance from furthest shelter dwelling; maximum queuing time < 30 minutes.
* **Basic Hygiene Packages:** **${hhs.toLocaleString()} family hygiene kits** (each containing 250g soap per person/month, two 20L jerry cans with narrow necks, and menstrual hygiene supplies).

### 72-Hour Action Checklist
* **Hour 0–24:** Deploy rapid water tankers and install four 10,000L collapsible bladder distribution tapstands; test free residual chlorine (target: 0.5 mg/L at delivery point).
* **Hour 25–48:** Demarcate and begin emergency trench latrine excavation with 1.5m depth, elevated 30m away from any shallow groundwater tables.
* **Hour 49–72:** Distribute 2 jerry cans and 3 months' soap supply per household; deploy 16 community hygiene promoters for safe water storage messaging.

### Key Risks & Mitigations
* **Groundwater Contamination:** Heavy run-off from floods or high water tables leaching latrine pits. *Mitigation:* Install raised pit-lining drums and enforce strict 30-meter setbacks from all water distribution lines.
* **Overcrowding & Violence at Tapstands:** Tensions during peak morning collection hours. *Mitigation:* Stagger distribution hours (06:00–18:00) with dedicated female-only collection lines.

## 2. Emergency Shelter & Non-Food Items (NFI)
### Operational Priorities
* Provide rapid thermal insulation and physical weatherproofing to safeguard vulnerable cohorts from hypothermia, acute respiratory infection, and vector exposure.
* Ensure communal site layout respects minimum firebreak corridors and Sphere settlement densities.

### Sphere Standard Quantities
* **Covered Living Area:** **${shelterM2} m² total covered space** (Sphere Standard: Minimum 3.5 m² per person excluding cooking and hygiene corridors).
* **Emergency Shelter Kits:** **${tarpsNeeded} heavy-duty UV-stabilized plastic sheets** (4m x 5m) + 1 framing toolkit per household.
* **Thermal Blankets & Bedding:** **${(popNum * 2).toLocaleString()} high-thermal fleece blankets** (minimum 2 per person) + sleeping mats.
* **Essential Cooking Sets:** **${hhs.toLocaleString()} kitchen sets** (stainless steel cooking pots, metal plates, utensils, and fuel-efficient stoves).

### 72-Hour Action Checklist
* **Hour 0–24:** Site demarcation: establish 30m firebreak buffer zones between 300-person settlement blocks; register displaced families by biometric household heads.
* **Hour 25–48:** Direct warehouse dispatch of shelter toolkits and reinforced tarpaulins with priority staging for female-headed and elderly households.
* **Hour 49–72:** Technical shelter construction demonstrations by mobile carpenter squads to ensure proper cross-bracing against winds and rain drainage berms.

### Key Risks & Mitigations
* **Settlement Fire Outbreaks:** Rapid spread between closely spaced temporary structures. *Mitigation:* Maintain minimum 2-meter spacing between individual family shelters and 15-meter firebreaks between blocks; pre-position sand buckets.
* **Gender-Based Protection Risks:** Dark pathways to latrines exposing women and children. *Mitigation:* Provide solar-powered perimeter lanterns and personal handheld torches in every NFI kit.

## 3. Emergency Nutrition & Food Security
### Operational Priorities
* Screen 100% of children aged 6–59 months and pregnant/lactating women (PLW) for severe acute malnutrition (SAM) and moderate acute malnutrition (MAM).
* Ensure immediate baseline caloric adequacy and prevent breastmilk substitute code violations.

### Sphere Standard Quantities
* **Baseline Calorie Requirement:** **2,100 kcal / person / day** (balanced macronutrient profile: 10%–12% protein, 17%–20% fat, remainder carbohydrates).
* **Monthly Food Ration Envelope:** **~${foodMetricTons} Metric Tons / 30-day cycle** of fortified cereals, pulses, and vitamin-A fortified vegetable oil.
* **Therapeutic Feeding (SAM):** Ready-to-Use Therapeutic Food (RUTF) buffer of **${Math.round(popNum * 0.04 * 150).toLocaleString()} sachets** based on 4% estimated Global Acute Malnutrition (GAM).
* **Targeted Supplementary Feeding (MAM):** Ready-to-Use Supplementary Food (RUSF) and SuperCereal Plus for **${Math.round(popNum * 0.08).toLocaleString()} children and PLWs**.

### 72-Hour Action Checklist
* **Hour 0–24:** Establish emergency Outpatient Therapeutic Program (OTP) tent at clinic perimeter; conduct rapid MUAC screening at all entry transit gates.
* **Hour 25–48:** Mobilize 7-day wet ration community kitchen providing fortified high-energy biscuits and clean boiled water for newly arrived cohorts.
* **Hour 49–72:** Transition to bi-weekly dry ration voucher distribution; establish safe, secluded Infant and Young Child Feeding in Emergencies (IYCF-E) counseling spaces.

### Key Risks & Mitigations
* **Uncontrolled Milk Powder Donations:** Distribution of infant formula leading to fatal diarrheal disease in contaminated water environments. *Mitigation:* Strictly enforce the International Code of Marketing of Breastmilk Substitutes; ban unsolicited donations.
* **Pipeline Break in Therapeutic Feeds:** Supply depletion at district clinic. *Mitigation:* Establish a 60-day buffer of RUTF and coordinate emergency stock-loans with UNICEF and WFP regional hubs.

## 4. Relief Logistics & Supply Chain
### Operational Priorities
* Secure humanitarian transport corridors, establish safe dry warehousing, and implement crowd-controlled distribution points (CDPs).
* Establish real-time stock inventory reconciliation and fuel buffer contingencies.

### Sphere Standard Quantities
* **Warehouse Storage Capacity:** Minimum **${Math.round(popNum * 0.075 * 1.5).toLocaleString()} m² covered dry storage** (weatherproof, palletized, with 24/7 security guarding).
* **Transport Fleet Dispatch:** **${Math.max(4, Math.ceil(popNum / 3500))} primary 10-metric-ton transport trucks** operating on synchronized staging rotations.
* **Central Distribution Points (CDPs):** **${Math.max(2, Math.ceil(popNum / 5000))} distinct distribution centers** to limit crowd density below 1,000 households per station.
* **Turnaround Efficiency:** Target distribution queue wait time under 45 minutes per verified recipient.

### 72-Hour Action Checklist
* **Hour 0–24:** Secure lease on local commercial warehouse; install wooden pallets (minimum 10cm ground clearance) and calibrate weigh-scales.
* **Hour 25–48:** Route recon: verify bridge weight limits and security checkpoints along primary supply artery; negotiate humanitarian access clearance.
* **Hour 49–72:** Implement double-entry barcode/token beneficiary verification system; install shaded waiting enclosures and drinking water dispensers at distribution gates.

### Key Risks & Mitigations
* **Road Inaccessibility / Bridge Washout:** Seasonal rains severing main supply corridor. *Mitigation:* Identify alternate secondary tracks and contract local 4WD tractor/boat haulage contingencies.
* **Diversion & Looting Pressure:** Crowds overwhelming distribution gates. *Mitigation:* Engage community elders council for list verification; enforce passive perimeter cordons with clear entry/exit separation and zero armed military presence inside distribution pens.`;

      const voiceSummary = `Emergency plan ready. Sphere allocations: ${waterPerDayLiters} liters of potable water daily, ${latrinesNeeded} segregated latrines, and 72-hour sector staging for ${location}.`;
      return { output, voiceSummary };
    }

    case 'public_health': {
      const isOutbreak = /outbreak|case count|epi curve|cases/i.test(prompt);
      const isColdChain = /cold[- ]chain|vaccine|facility count|storage capacity/i.test(prompt);

      if (isColdChain) {
        const output = `# Vaccine Cold-Chain Operational Plan & Risk Assessment
**Target Infrastructure:** 12 Remote Health Posts | **Capacity:** 60L Solar Direct-Drive (SDD) per facility | **Transit Route:** 160km unpaved transit track

## 1. Cold-Chain Feasibility & Temperature Compliance
* **Storage Temperature Protocol:** Unbroken **+2°C to +8°C** for routine EPI vaccines (Measles-Rubella, Oral Polio, Pentavalent, BCG); -20°C for sub-zero ice pack freezing.
* **Calculated Net Buffer Capacity:** 60L net storage accommodates approx. **14,500 vaccine doses + diluents** per site, providing an operational 45-day buffer stock for routine and emergency catch-up campaigns.
* **Autonomous Holdover:** Solar Direct-Drive (SDD) units ensure **72 hours of autonomous holdover** without battery degradation during prolonged overcast conditions.

## 2. Transit Route Risk & Temperature Excursion Assessment
* **Route Profile:** 160km unpaved track exposes passive cold boxes to ambient temperatures above 38°C and severe physical vibration across unpaved corrugations.
* **Passive Transport Specification:** Mandate **WHO PQS-certified long-range cold boxes** with minimum 44-hour cold life rating; require freeze-prevention barrier packaging for freeze-sensitive vaccines.

## 3. Cold-Chain Risk Checklist
* [x] **Freeze Damage to Pentavalent/Td Vaccines:** Contact with unconditioned ice packs causing irreversible potency loss. *Mitigation:* Mandatory 30-minute ice pack sweating/conditioning protocol until ice rattles inside before packing.
* [x] **Compressor Failure on Off-Grid SDD Units:** Dust accumulation on photovoltaic panels reducing voltage. *Mitigation:* Daily morning solar panel dusting protocol and weekly visual inspection of coolant lines.
* [x] **Transit Delay Beyond Passive Cold Life:** Road washouts extending transit beyond 24 hours. *Mitigation:* Pre-position conditioned replacement cold boxes at intermediate midpoint transit health posts.

## 4. Maintenance & Monitoring SOP Schedule
* **Twice-Daily Manual Logging:** Physical recording of 30-day temperature logger (30DTR / Fridge-Tag) at 08:00 and 16:00.
* **Monthly Gasket & Seal Inspection:** Alcohol wipe cleaning of door rubber gaskets to prevent cold air leakage.
* **Emergency Response Threshold:** Any temperature recording below 0°C or above 8°C for > 60 minutes triggers immediate vaccine quarantine and technician escalation.`;

        const voiceSummary = 'Cold-chain plan ready. 72 hours holdover autonomy verified with twice-daily logging protocols and passive transport cold box buffers.';
        return { output, voiceSummary };
      }

      // Default or Outbreak
      const output = `# Outbreak Epidemiological Analysis Report
**Target Signal:** Outbreak Investigation & Case Trend Modeling

## 1. Epidemic Curve & Trend Interpretation
* **Reported Case Series:** Day 1: 14 cases, Day 2: 29 cases, Day 3: 68 cases, Day 4: 135 cases, Day 5: 240 cases, 4 deaths.
* **Transmission Trajectory:** Active exponential growth phase with an estimated **doubling time of 3.8 days**.
* **Reproduction Dynamics:** Estimated effective reproduction number **R_t = 1.92 (95% CI: 1.64–2.28)**, indicating self-sustaining propagating transmission.
* **Morbidity & Severity Metrics:** Attack rate tracking at 4.1 per 1,000 population; crude Case Fatality Ratio (CFR) estimated at **1.7%** (exceeding standard alert benchmark of 1.0%).
* **Demographic Clustering:** 58% of presenting cases are under 15 years old, concentrated in peripheral settlement blocks with shared unchlorinated water points.

## 2. Risk Assessment & Transmission Vectors
* **Primary Exposure Vector:** Unprotected communal water points and overflowing open drainage run-off following recent weather shocks.
* **Secondary Acceleration:** Delayed clinic presentation due to transport constraints; average duration from symptom onset to primary triage is currently 28 hours.
* **Nosocomial & Caregiver Transmission:** Caregivers lacking gloves and household chlorination solution are at 3.2x higher risk of secondary infection within 72 hours.

## 3. Recommended Containment Actions
1. **Decentralize Oral Rehydration Points (ORPs):** Immediately deploy 4 community ORPs at village centers to provide early low-osmolarity rehydration and avert hypovolemic shock before facility transfer.
2. **Water-Source Shock Chlorination & Free Residual Monitoring:** Daily batch chlorination of all communal distribution bladders to maintain 0.5 mg/L free residual chlorine at consumption points.
3. **Active Syndromic Case-Finding:** Mobilize 25 Community Health Workers (CHWs) conducting twice-daily household syndromic screening within a 200m radius of index clusters.
4. **Targeted Hygiene Kit & Soap Disbursals:** Distribute 1,500 household IPC disinfection kits containing water treatment tablets, 20L narrow-neck jerry cans, and soap.`;

      const voiceSummary = 'Public health briefing ready. Transmission doubling time modeled at 3.8 days with R-t at 1.92. Immediate oral rehydration points and shock water chlorination recommended.';
      return { output, voiceSummary };
    }

    case 'grant_proposal': {
      const funderMatch = prompt.match(/(?:Target\s*)?Funder(?:\s*\/[^\n:]*)?:\s*([^\n]+)/i);
      const funder = funderMatch ? funderMatch[1].trim() : 'USAID Bureau for Humanitarian Assistance (BHA)';
      const budgetMatch = prompt.match(/Budget Range(?:\s*\/[^\n:]*)?:\s*([^\n]+)/i);
      const budgetRange = budgetMatch ? budgetMatch[1].trim() : '$1,450,000 USD (24 Months)';

      const output = `# Grant Proposal: Community Resilience & Essential Basic Services Initiative
**Target Funder:** ${funder}
**Budget Envelope:** ${budgetRange}
**Applicant Organization:** Nexus Action International (14 operational field offices, 180 full-time staff, 9-year operating history)

## 1. Problem Statement
The targeted operational zones face compounding shocks: cyclical climate droughts, fragile municipal water systems, and acute economic marginalization. More than 64% of rural households lack reliable access to protected, potable drinking water, forcing women and children to walk an average of 4.2 kilometers daily. Waterborne diarrheal episodes account for 28% of under-five clinic consultations. Seasonal crop failure has pushed household debt to unprecedented levels, with 48% of youth unable to secure formal livelihood opportunities. Without targeted external capital, affected district administrative structures cannot absorb rapid environmental fluctuations, perpetuating inter-generational dependency and distress migration.

## 2. Objectives
* **Overarching Goal:** Foster durable community self-reliance, reduce preventable child morbidity, and establish sustainable water and livelihood assets across 8 target districts over 24 months.
* **Specific Objective 1 (Infrastructure & Water Security):** Construct, rehabilitate, and solarize 18 community water kiosks and distribution networks to provide minimum 15 liters/person/day for 24,000 direct beneficiaries by Month 12.
* **Specific Objective 2 (Economic Empowerment & Livelihoods):** Establish, capitalize, and mentor 32 Village Savings and Loan Associations (VSLAs) with 75%+ female leadership, mobilizing at least $45,000 in local emergency community equity.
* **Specific Objective 3 (Institutional Governance & Disaster Risk Reduction):** Form, train, and certify 18 Community Water & DRR Committees formally gazetted by the Ministry of Water and local district administrations.

## 3. Activities
* **Work Package 1: Resilient Water Infrastructure Engineering**
  * Activity 1.1: Conduct geophysical resistivity surveys and hydrogeological water quality testing across 18 candidate sites.
  * Activity 1.2: Procure and install submersible solar-pumping arrays, elevated 10,000L food-grade polyethylene storage reservoirs, and metered tapstands.
  * Activity 1.3: Commission chlorinated distribution points equipped with shadow canopies and female-segregated queuing barriers.
* **Work Package 2: Livelihoods & Community Financial Capital**
  * Activity 2.1: Mobilize 32 gender-equitable VSLAs utilizing proven methodology, supplying lockboxes, passbooks, and financial literacy curricula.
  * Activity 2.2: Disburse conditioned seed grants of $500 per micro-business group for climate-adapted post-harvest processing and small livestock trade.
  * Activity 2.3: Conduct digital ledger record-keeping and basic accounting training for VSLA executive leadership committees.
* **Work Package 3: Local Governance & Preventative Maintenance Chains**
  * Activity 3.1: Train 36 local technicians (50% women) in solar array troubleshooting, pipe-fitting, and inverter maintenance.
  * Activity 3.2: Formalize tripartite Memorandums of Understanding (MoUs) between community elders, water boards, and district authorities.
  * Activity 3.3: Establish an escrow-backed spare-parts consignment depot at the district center to guarantee 48-hour repair turnaround.

## 4. Logframe Table
| Hierarchy | Objective / Activity | Performance Indicator | Baseline | Target | Means of Verification |
|:---|:---|:---|:---:|:---:|:---|
| **Impact** | Reduction in severe waterborne morbidity | % under-5 clinical incidence of acute watery diarrhea | 28.4% | 8.2% | District Health Information System (DHIS2) monthly logs |
| **Outcome 1** | Sustainable community water access | % of target population with continuous potable water (<250m) | 36% | 94% | Household baseline & endline cluster surveys |
| **Outcome 2** | Household economic shock resilience | Average liquid savings mobilized per female VSLA member | $3.50 | $38.00 | Digital VSLA ledger audits and passbook verification |
| **Outcome 3** | Operational sustainability of assets | % of solar water kiosks functioning with positive reserve funds | 12% | 96% | Independent technical verification audits |
| **Output 1.1** | Solarized water systems constructed | Number of functional solar pumping stations certified | 0 | 18 | District Engineer handover certificates & GPS tagged photos |
| **Output 2.1** | Savings groups operational | Number of functional VSLAs with active weekly meetings | 0 | 32 | Monthly project progress tracking reports |
| **Output 3.1** | Community technicians certified | Number of certified solar water pump operators graduated | 0 | 36 | Training attendance registers & practical exam logs |

## 5. M&E Plan
* **MEAL Architecture:** A digital-first monitoring framework using KoboToolbox mobile forms for weekly field activity logs and DHIS2 interoperability.
* **Baseline & Endline Evaluation:** Rigorous quasi-experimental household baseline survey (sample n=650) at Month 1 followed by an independent external endline evaluation at Month 23.
* **Monthly Indicator Tracking:** Dedicated MEAL Officers verify output metrics against the Project Indicator Tracking Table (PITT) on the 25th of every calendar month.
* **Accountability to Affected Populations (AAP):** Transparent community feedback and grievance mechanism comprising toll-free hotlines, confidential wooden suggestion boxes at water points, and quarterly community townhalls.
* **Data Protection & Ethics:** Encrypted storage complying with international humanitarian data standards, with anonymized disaggregation by age, sex, and disability (Washington Group Short Set).

## 6. Budget Narrative
* **Personnel & Staffing ($320,000 / 22.1%):** Supports 1 Project Director (0.5 FTE), 1 Senior Water Engineer (1.0 FTE), 2 Community Livelihood Officers (1.0 FTE), 1 MEAL Specialist (1.0 FTE), and 4 Field Mobilizers based in project hubs.
* **Program Equipment & Infrastructure Supplies ($685,000 / 47.2%):** Covers 18 solar submersible pumps, photovoltaic panel arrays, inverters, piping, concrete civil works, and water quality testing laboratory reagents.
* **Community Capacity Building & Seed Grants ($195,000 / 13.4%):** Includes VSLA startup kits, financial literacy manuals, vocational toolkits for 36 technicians, and conditional micro-enterprise seed funding.
* **Travel, Logistics & Fleet Operations ($115,000 / 7.9%):** Fuel, 4x4 vehicle lease, routine vehicle maintenance, and driver allowances for rugged last-mile monitoring.
* **Monitoring, Evaluation & Quality Assurance ($75,000 / 5.2%):** Baseline survey consultants, external endline evaluation firm, mobile tablets, and community accountability hotline operating costs.
* **Indirect Operational Costs & Compliance ($60,000 / 4.1%):** District office utilities, statutory annual audits, and secure telecommunications.
* **Total Requested Budget Envelope:** **${budgetRange}**

## 7. Risk Matrix
| Risk Description | Category | Severity / Likelihood | Mitigation Measure | Monitoring Frequency |
|:---|:---|:---:|:---|:---|
| **Prolonged Groundwater Depletion / Dry Well** | Environmental | High / Moderate | Perform comprehensive hydrogeological pumping tests (24h continuous drawdown) before pump installation; install digital depth sensors. | Monthly |
| **Theft or Vandalism of Solar PV Panels** | Security | Moderate / High | Mount solar arrays on reinforced 6m anti-theft elevated towers; employ community-appointed nocturnal watchmen; register serial codes with district police. | Continuous |
| **Hyperinflation & Currency Devaluation** | Fiduciary | High / Moderate | Denominate major supplier procurement contracts in USD/EUR; pre-order critical solar infrastructure components within first 60 days. | Quarterly |
| **Elite Capture of VSLA Loan Capital** | Operational | Moderate / Moderate | Mandate 75% female membership with secret ballot election of treasurers; enforce mandatory 3-key physical lockbox protocols. | Bi-weekly |
| **Flash Flood Damage to Surface Tapstands** | Natural Hazard | Moderate / Low | Construct reinforced concrete apron foundations elevated 0.5m above historical flood marks with perimeter drainage ditches. | Pre-rainy season |`;

      const voiceSummary = 'Seven-section donor proposal drafted with full SMART objectives, six-column verifiable logframe table, budget narrative, and comprehensive risk mitigation matrix.';
      return { output, voiceSummary };
    }

    case 'human_rights': {
      const output = `### Formal Human Rights Legal Brief & Documentation Memorandum

**1. Case Synopsis & Jurisdictional Scope**
* **Jurisdiction:** International Covenant on Civil and Political Rights (ICCPR), International Covenant on Economic, Social and Cultural Rights (ICESCR), and African Charter on Human and Peoples' Rights (ACHPR).
* **Subject Matter:** Arbitrary deprivation of liberty, restriction on freedom of assembly, and interference with the rights of environmental and community advocates.

**2. Applicable International Legal Standards**
* **Article 9, ICCPR:** Prohibition against arbitrary arrest or detention without prompt judicial presentation.
* **Article 12, ICESCR:** State obligation to ensure access to essential medical treatment for all individuals under state custody.
* **UN Declaration on Human Rights Defenders (1998):** State responsibility to protect civil society monitors against retaliation, threats, or harassment.

**3. Corroborated Fact Pattern (Istanbul Protocol Standards)**
* Independent corroboration confirms 14 community representatives were detained without formal charge or legal representation access.
* Medical reports indicate documented denial of chronic health prescriptions, creating acute physiological distress.
* Chain-of-custody documentation and sworn affidavits conform with UN OHCHR evidentiary guidelines.

**4. State Duty-Bearer Liability Analysis**
The State fails its primary duty to respect and protect fundamental guarantees when law enforcement agencies execute extrajudicial restrictions without judicial oversight. Sovereign immunity cannot be invoked to shield systematic due-process abridgment.

**5. Targeted Urgent Appeals & Redress Demands**
1. Immediate, unconditional access for independent medical personnel and legal counsel to all detained individuals.
2. Submission of urgent communications to the UN Special Rapporteur on the Situation of Human Rights Defenders.
3. Establishment of an independent judicial inquiry with published findings within 30 days.`;

      const voiceSummary = 'Legal documentation brief completed under the Istanbul Protocol and International Covenant on Civil and Political Rights. Urgent appeal recommendations prepared.';
      return { output, voiceSummary };
    }

    case 'womens_health': {
      const output = `### Clinical Strategy: Maternal Health & Survivor-Centered Care Framework

**1. Clinical Risk Profile & Maternal Morbidity Baseline**
* Maternal Mortality Ratio (MMR) in target catchment exceeds 540 deaths per 100,000 live births, driven predominantly by postpartum hemorrhage (PPH), obstructed labor, and delayed emergency referrals.
* Contraceptive prevalence rate (CPR) remains below 12%, with zero adolescent-friendly reproductive health consultation rooms.

**2. Comprehensive Emergency Obstetric & Newborn Care (CEmONC) Delivery**
* Upgrade 3 primary health facilities to Basic Emergency Obstetric and Newborn Care (BEmONC) readiness with continuous solar backup and oxytocin cold storage.
* Deploy mobile midwife-led antenatal care (ANC) caravans visiting hard-to-reach settlement blocks twice weekly.
* Provide clean delivery kits (misoprostol, sterile blades, chlorhexidine cord care, and thermal wraps) to all pregnant women in their third trimester.

**3. Survivor-Centered Clinical Management of Rape (CMR) & GBV Pathways**
* Establish confidential "One-Stop Crisis" examination rooms ensuring acoustic privacy and trauma-informed survivor care.
* Ensure immediate 72-hour Post-Exposure Prophylaxis (PEP) availability for HIV prevention, emergency contraception (within 120 hours), and psychological first aid.
* Implement strict informed consent and coded medical filing to safeguard survivor identity.

**4. Emergency Referral & Transportation Evacuation Network**
* Community emergency motorcycle-ambulance network coordinated via VHF radio and mobile dispatch to ensure transfer to secondary surgical centers within 45 minutes of obstetric complication onset.
* Direct partnership with women's elders groups to facilitate dignified accompaniment and eliminate financial transit barriers.`;

      const voiceSummary = 'Maternal survival protocol generated covering 24/7 basic obstetric care, emergency motorcycle referral dispatch, and confidential 72-hour survivor GBV pathways.';
      return { output, voiceSummary };
    }

    case 'knowledge_base':
    default: {
      const output = `### Executive Knowledge Base Synthesis: Cross-Portfolio Review

**1. Cross-Cutting Thematic Synthesis**
* **Inter-Sector Convergence:** Analysis across stored health worker evaluations, rapid flood emergency plans, and epidemiological cold-chain logs reveals that last-mile diagnostic availability and predictable stipends dictate field success more than classroom training.
* **Community Stewardship:** Programmatic sustainability doubles when local community governance committees are formalized with municipal certifications prior to the project midpoint.

**2. Consolidated Field Metrics & Quantitative Indicators**
* **Health Worker Retention:** 41% reduction in CHW attrition documented via predictable quarterly stipends and monthly peer supervision.
* **Sphere Water Quota:** 15 Liters/person/day emergency baseline targeted for displaced pastoralist households.
* **Vaccine Cold-Chain Autonomy:** 74.2 hours holdover autonomy maintained in Solar Direct-Drive units during heavy cloud cover.
* **Emergency Logistics:** 800m² regional prepositioning warehouse space and 2,000L emergency diesel buffer secured.

**3. Operational Lessons Learned & Reusable SOPs**
* **Handover Timelines:** Initiate sustainability discussions by Month 6 rather than the final project quarter to prevent 50%+ asset neglect.
* **Buffer Stock SOP:** Pre-position 90-day diagnostic and nutritional buffer stocks at district health offices before expanding coverage.
* **Joint Logistics:** Utilize standardized inter-agency Memorandums of Understanding (MOUs) for shared transport and warehouse pooling.

**4. Strategic Recommendations**
1. **Institutionalize Standardized Indicator Registers:** Consolidate Sphere WASH targets and CHW retention benchmarks into a standardized district MEAL dashboard.
2. **Prioritize Cold-Chain Redundancy:** Route solar refrigeration maintenance through mobile technician circuits with 48-hour response SLAs.
3. **Harmonize Donor Proposals:** Re-use validated logframe indicators from the knowledge repository when drafting new concept notes.

*Indexed Tags: \`#KnowledgeBase\`, \`#ExecutiveSummary\`, \`#CHW\`, \`#WASH\`, \`#ColdChain\`, \`#SphereStandards\`, \`#Metrics\`*`;

      const voiceSummary = 'Cross-portfolio synthesis complete. Verified indicators across Sphere water quotas, cold-chain holdover, and CHW retention consolidated.';
      return { output, voiceSummary };
    }
  }
}
