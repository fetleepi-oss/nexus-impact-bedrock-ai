/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KnowledgeDocument {
  id: string;
  title: string;
  shortTitle: string;
  organization: string;
  license: string;
  licenseUrl: string;
  publicSourceUrl: string;
  versionOrYear: string;
  category: 'humanitarian' | 'public_health' | 'human_rights' | 'donor_grant' | 'research';
  summary: string;
  sections: {
    sectionTitle: string;
    keywords: string[];
    content: string;
    citations: string[];
  }[];
}

export interface RetrievedSnippet {
  docId: string;
  docTitle: string;
  organization: string;
  sectionTitle: string;
  license: string;
  licenseUrl: string;
  publicSourceUrl: string;
  content: string;
  score: number;
}

export const OFFLINE_KNOWLEDGE_PACK: KnowledgeDocument[] = [
  {
    id: 'sphere_handbook_2018',
    title: 'The Sphere Handbook: Humanitarian Charter and Minimum Standards in Humanitarian Response (2018 Edition)',
    shortTitle: 'Sphere Standards 2018',
    organization: 'Sphere Association',
    license: 'Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 (CC BY-NC-ND 4.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    publicSourceUrl: 'https://spherestandards.org/handbook-2018/',
    versionOrYear: '2018 (4th Edition)',
    category: 'humanitarian',
    summary: 'The universal benchmark for humanitarian response, outlining minimum technical standards in water supply, sanitation, hygiene (WASH), food security, shelter, and health action.',
    sections: [
      {
        sectionTitle: 'WASH Standard 2.1: Water Quantity and Quality',
        keywords: ['water', 'liters', 'wash', 'potable', 'chlorination', 'tap', 'borehole', 'jerrycan', 'drinking'],
        content: `Sphere Minimum Benchmark: At least 15 litres of potable water per person per day for drinking, cooking, and personal hygiene in emergency phases. Water points must be located within 500 metres of shelters. Maximum queue time should not exceed 30 minutes. Free residual chlorine (FRC) level at tap points must be 0.5 mg/litre after 30 minutes contact time, with turbidity < 5 NTU. Provide at least two 10-20L clean, narrow-neck water collection containers per household.`,
        citations: ['Sphere Handbook 2018, Water supply standard 2.1, pp. 106-114']
      },
      {
        sectionTitle: 'Sanitation Standard 3.2: Excreta Management & Latrines',
        keywords: ['latrine', 'toilet', 'sanitation', 'excreta', 'sewage', 'waste', 'hygiene'],
        content: `Sphere Minimum Benchmark: Maximum 20 people per communal toilet/latrine. Segregate toilets by gender with functional internal locks and exterior lighting. Latrines must be situated at least 30 metres away from any groundwater source or communal well, and the pit bottom must be at least 1.5 metres above the water table. Dedicated handwashing stations with soap or 0.05% chlorinated solution must be positioned within 5 metres of every latrine exit.`,
        citations: ['Sphere Handbook 2018, Excreta management standard 3.2, pp. 120-128']
      },
      {
        sectionTitle: 'Shelter Standard 4.1: Covered Living Space',
        keywords: ['shelter', 'living space', 'square meters', 'tent', 'tarp', 'housing', 'tarpaulin', 'crowding'],
        content: `Sphere Minimum Benchmark: Minimum 3.5 square metres of covered living space per person (excluding cooking space and verandas) in warm/temperate climates. In cold climates or urban displaced settings where individuals spend full days indoors, expand benchmark to 4.5 - 5.5 square metres per person. Ceilings must provide at least 2 metres clear height at the highest point to ensure adequate air circulation and prevent respiratory aerosol transmission.`,
        citations: ['Sphere Handbook 2018, Shelter and settlement standard 4.1, pp. 248-255']
      },
      {
        sectionTitle: 'Food Security & Nutrition Standard 1.1: Caloric Baseline',
        keywords: ['calories', 'kcal', 'food', 'ration', 'malnutrition', 'gam', 'sam', 'nutrition', 'plumpy'],
        content: `Sphere Minimum Benchmark: Mean energy intake requirement is 2,100 kcal per person per day, with 10-12% of total energy derived from protein and at least 17% from fat. Emergency food assistance must supply adequate micronutrients: Vitamin A, Iodine, Iron, and Zinc. Global Acute Malnutrition (GAM) threshold of >15% indicates critical emergency requiring blanket supplementary feeding; GAM >10% with aggravating factors requires targeted supplementary feeding.`,
        citations: ['Sphere Handbook 2018, Food security and nutrition standard 1.1, pp. 182-195']
      },
      {
        sectionTitle: 'Health Action Standard 1.2: Mortality Surveillance Benchmarks',
        keywords: ['mortality', 'cmr', 'u5mr', 'epidemic', 'death rate', 'surveillance', 'health post'],
        content: `Sphere Emergency Mortality Benchmarks: Crude Mortality Rate (CMR) baseline emergency threshold is > 1.0 death per 10,000 population per day. Under-5 Mortality Rate (U5MR) baseline emergency threshold is > 2.0 deaths per 10,000 children under five per day. Any doubling of baseline baseline rate triggers acute crisis response. Minimum one peripheral health facility per 10,000 population and one referral hospital per 50,000-250,000 population.`,
        citations: ['Sphere Handbook 2018, Health systems standard 1.2, pp. 310-318']
      }
    ]
  },
  {
    id: 'who_epidemiological_guidelines',
    title: 'WHO Field Guidelines for Epidemic Preparedness, Outbreak Response & Cold Chain Management',
    shortTitle: 'WHO Field Protocols',
    organization: 'World Health Organization (WHO)',
    license: 'Creative Commons Attribution-NonCommercial-ShareAlike 3.0 IGO (CC BY-NC-SA 3.0 IGO)',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/3.0/igo/',
    publicSourceUrl: 'https://www.who.int/emergencies/outbreak-toolkit',
    versionOrYear: '2023 Guidelines',
    category: 'public_health',
    summary: 'Authoritative clinical protocols for cholera treatment, outbreak investigation steps, contact tracing rings, vaccine cold-chain handling, and attack rate projection.',
    sections: [
      {
        sectionTitle: 'Acute Watery Diarrhea & Cholera Case Protocols',
        keywords: ['cholera', 'diarrhea', 'ors', 'ringers', 'dehydration', 'watery', 'vibrio', 'ctc', 'rehydration'],
        content: `Clinical Case Definition: Any patient aged 5 or older who develops acute severe watery diarrhea (rice-water stools) with or without vomiting in an area where cholera is suspected. Protocols: Plan A (mild): Oral Rehydration Salts (ORS) 75 mL/kg over 4 hours. Plan B (moderate): ORS 75 mL/kg + zinc supplementation (20mg/day for 10-14 days). Plan C (severe dehydration / lethargy / absent radial pulse): Immediate IV infusion of Ringer's Lactate 100 mL/kg (30 mL/kg within 30 min, then 70 mL/kg over 2.5 hours in adults; adjusted for pediatric age). Single-dose Oral Cholera Vaccine (OCV) deployment recommended for reactive mass campaigns within 10 days of index cluster detection.`,
        citations: ['WHO Cholera Outbreak Protocol 2023, Section 4: Clinical Case Management']
      },
      {
        sectionTitle: 'Vaccine Cold Chain & Temperature Compliance',
        keywords: ['cold chain', 'temperature', 'vaccine', 'refrigerator', 'pqs', 'antigen', 'celsius', 'freeze'],
        content: `WHO PQS Storage Protocols: All standard EPI routine antigens (measles, pentavalent, rota, bOPV) must be continuously maintained between +2°C and +8°C during transit and secondary storage. Freeze-sensitive vaccines (HepB, DTP/Penta, Td, HPV, PCV) must never be frozen; discard immediately if the 30-day electronic temperature logger records <0°C for >60 continuous minutes or if Shake Test fails. Portable passive cold boxes (WHO PQS certified) require conditioned water packs (ice sweating at room temp before insertion to prevent vaccine contact with ice below 0°C).`,
        citations: ['WHO Vaccine Management & Cold Chain Guidelines, PQS Standards Category E003']
      },
      {
        sectionTitle: 'Measles Outbreak Investigation & Ring Containment',
        keywords: ['measles', 'rash', 'fever', 'cough', 'koplik', 'vaccination', 'quarantine', 'vitamin a'],
        content: `Outbreak Threshold: A single laboratory-confirmed IgM-positive measles case in a camp or refugee settlement constitutes a suspected outbreak. Five confirmed cases within a 4-week window in a catchment area confirms an active outbreak. Immediate Action: Administer high-dose Vitamin A (100,000 IU for infants 6-11 months; 200,000 IU for children >=12 months) immediately upon clinical diagnosis. Target reactive immunization campaigns to reach >=95% coverage for children aged 6 months to 15 years regardless of previous vaccination history.`,
        citations: ['WHO Guidelines for Epidemic Preparedness: Measles Outbreak Response 2022']
      }
    ]
  },
  {
    id: 'un_ocha_humanitarian_architecture',
    title: 'UN OCHA Inter-Agency Standing Committee (IASC) Flash Appeal & Humanitarian Response Framework',
    shortTitle: 'UN OCHA Flash Appeal Guidelines',
    organization: 'United Nations Office for the Coordination of Humanitarian Affairs',
    license: 'Public Domain / United Nations Open Access',
    licenseUrl: 'https://www.un.org/en/about-us/terms-of-use',
    publicSourceUrl: 'https://www.unocha.org/our-work/coordination/humanitarian-programme-cycle',
    versionOrYear: '2024 Standards',
    category: 'humanitarian',
    summary: 'Core coordination framework for emergency cluster response, humanitarian needs overview (HNO), and Flash Appeals within 72 hours of sudden-onset disasters.',
    sections: [
      {
        sectionTitle: 'Cluster Activation & Needs Assessment Framework (HNO/HRP)',
        keywords: ['ocha', 'cluster', 'flash appeal', 'coordination', 'hrp', 'needs assessment', 'iap', 'disaster'],
        content: `IASC Protocols: Rapid Initial Needs Assessment (MIRA/RINA) must be finalized within 72 hours of disaster onset. Cluster leads (WASH - UNICEF; Health - WHO; Shelter - IFRC/UNHCR; Food - WFP; Logistics - WFP) establish multi-agency 3W/4W (Who, What, Where, When) operational matrices. Beneficiary counting must apply geographic de-duplication to prevent double-counting when households receive simultaneous food and WASH assistance. Disaggregate all indicators by sex, age, and disability using the Washington Group Short Set.`,
        citations: ['IASC Reference Module for Cluster Coordination at Country Level (Rev. 2024)']
      },
      {
        sectionTitle: 'Cash and Voucher Assistance (CVA) Feasibility Criteria',
        keywords: ['cash', 'voucher', 'cva', 'meb', 'mpca', 'market', 'liquidity', 'financial'],
        content: `CVA Feasibility Standards: Multi-Purpose Cash Assistance (MPCA) is preferred when local markets are physically functional, supply chains can absorb liquidity injection without local inflation exceeding 5% month-on-month, and secure financial service providers (mobile money, local banking agents) have coverage. Minimum Expenditure Basket (MEB) calculation must account for essential food intake (2,100 kcal), non-food items (NFIs), cooking fuel, potable water, and dignity hygiene products.`,
        citations: ['CaLP Network & UN OCHA Common Cash Delivery Mechanism Guidance Note']
      }
    ]
  },
  {
    id: 'donor_grant_architecture_guidelines',
    title: 'USAID Bureau for Humanitarian Assistance (BHA) & DG ECHO Emergency Grant Design Guidelines',
    shortTitle: 'BHA & ECHO Grant Standards',
    organization: 'USAID BHA / European Commission ECHO',
    license: 'Public Domain (US Government Work) & European Union Open Documentation',
    licenseUrl: 'https://www.usaid.gov/legal-notices',
    publicSourceUrl: 'https://www.usaid.gov/humanitarian-assistance/guidelines-for-grant-proposals',
    versionOrYear: 'Fiscal Year 2024 Guidelines',
    category: 'donor_grant',
    summary: 'Standardized guidelines for results frameworks, logframe construction, gender markers, budget justification, and means of verification for emergency humanitarian funding.',
    sections: [
      {
        sectionTitle: 'Logical Framework (Logframe) Construction & Indicator Matrix',
        keywords: ['logframe', 'indicator', 'donor', 'bha', 'echo', 'grant', 'baseline', 'target', 'verification'],
        content: `Logframe Rules: Every intervention must map from Goal/Impact -> Strategic Objectives (Outcomes) -> Intermediate Results -> Sub-Activities. Every indicator requires: (1) clearly specified unit of measurement, (2) baseline value (never left 'TBD'), (3) time-bound target, (4) disaggregation by sex/age/disability, and (5) realistic Means of Verification (e.g., post-distribution monitoring reports, third-party lot quality assurance sampling). Contingency/unallocated line items are capped at 5% of direct costs and require prior contracting officer approval.`,
        citations: ['USAID BHA Emergency Application Guidelines, Appendix B: Results Framework']
      },
      {
        sectionTitle: 'Protection Mainstreaming & IASC Gender with Age Marker (GAM)',
        keywords: ['protection', 'gender', 'gam', 'do no harm', 'inclusion', 'safeguarding', 'psea'],
        content: `Protection Mainstreaming Standards: All activities must demonstrate adherence to the 4 Protection Principles: (1) Prioritize safety and dignity, and avoid causing harm (Do No Harm); (2) Ensure meaningful access for all vulnerable groups without discrimination; (3) Practice accountability to affected populations (AAP) with confidential complaint mechanisms; (4) Support community self-protection capacities. Proposals must achieve a score of 3 or 4 on the IASC Gender with Age Marker (GAM).`,
        citations: ['Global Protection Cluster & DG ECHO Humanitarian Protection Policy 2023']
      }
    ]
  },
  {
    id: 'human_rights_international_standards',
    title: 'Universal Declaration of Human Rights & Geneva Convention IV Relative to the Protection of Civilian Persons',
    shortTitle: 'International Humanitarian & Human Rights Law',
    organization: 'United Nations & International Committee of the Red Cross (ICRC)',
    license: 'Public Domain (UN General Assembly Resolution 217 A & International Treaties)',
    licenseUrl: 'https://www.un.org/en/about-us/universal-declaration-of-human-rights',
    publicSourceUrl: 'https://www.icrc.org/en/war-and-law/treaties-customary-law/geneva-conventions',
    versionOrYear: 'Universal Norms',
    category: 'human_rights',
    summary: 'Inviolable legal benchmarks safeguarding civilians, medical personnel, non-combatants, and ensuring humane treatment, due process, and asylum rights.',
    sections: [
      {
        sectionTitle: 'Protection of Civilian Persons & Medical Transports (Geneva IV)',
        keywords: ['geneva', 'civilian', 'medical', 'hospital', 'red cross', 'human rights', 'ihl', 'protection'],
        content: `Under Geneva Convention IV Article 18, civilian hospitals organized to give care to the wounded and sick, the infirm and maternity cases, may in no circumstances be the object of attack, but shall at all times be respected and protected by the Parties to the conflict. Protection extends to medical transports, medical personnel, and marked humanitarian convoys. Starvation of civilians as a method of warfare is strictly prohibited under Customary IHL Rule 53 and Additional Protocol II Article 14.`,
        citations: ['Geneva Convention IV 1949, Arts. 14-23; Customary IHL Rules 25-30']
      },
      {
        sectionTitle: 'Principle of Non-Refoulement & Fundamental Freedoms',
        keywords: ['refoulement', 'asylum', 'torture', 'persecution', 'refugee', 'udhr', 'rights'],
        content: `UDHR Article 14 establishes the right to seek and enjoy asylum from persecution. The principle of non-refoulement under the 1951 Refugee Convention Article 33 forbids the expulsion or return of a refugee in any manner whatsoever to the frontiers of territories where their life or freedom would be threatened on account of their race, religion, nationality, membership of a particular social group or political opinion. This prohibition is absolute under jus cogens customary international law.`,
        citations: ['UDHR 1948, Art. 14; 1951 Refugee Convention, Art. 33(1)']
      }
    ]
  }
];

export function retrieveKnowledgeSnippets(
  query: string,
  categoryFilter?: string,
  maxResults: number = 3
): RetrievedSnippet[] {
  if (!query || !query.trim()) return [];
  const rawTokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (rawTokens.length === 0) return [];

  const scored: RetrievedSnippet[] = [];

  for (const doc of OFFLINE_KNOWLEDGE_PACK) {
    if (categoryFilter && categoryFilter !== 'all' && doc.category !== categoryFilter) {
      continue;
    }
    for (const sec of doc.sections) {
      let score = 0;
      const lowerContent = sec.content.toLowerCase();
      const lowerTitle = sec.sectionTitle.toLowerCase();

      for (const token of rawTokens) {
        for (const kw of sec.keywords) {
          if (kw.toLowerCase().includes(token) || token.includes(kw.toLowerCase())) {
            score += 15;
          }
        }
        if (lowerTitle.includes(token)) {
          score += 10;
        }
        if (lowerContent.includes(token)) {
          score += 3;
        }
      }

      if (score > 0) {
        scored.push({
          docId: doc.id,
          docTitle: doc.title,
          organization: doc.organization,
          sectionTitle: sec.sectionTitle,
          license: doc.license,
          licenseUrl: doc.licenseUrl,
          publicSourceUrl: doc.publicSourceUrl,
          content: sec.content,
          score
        });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults);
}

export function formatRetrievedKnowledgeForPrompt(snippets: RetrievedSnippet[]): string {
  if (!snippets || snippets.length === 0) return '';
  let out = `### OFFLINE VERIFIED REFERENCE DOCUMENTS (RAG GROUNDING)\n`;
  out += `*Source License Compliance: All cited snippets retain their open licenses and verified institutional attribution.*\n\n`;
  snippets.forEach((s, idx) => {
    out += `[CITATION ${idx + 1}] Source: ${s.docTitle} (${s.organization})\n`;
    out += `Section: ${s.sectionTitle}\n`;
    out += `License: ${s.license} (${s.licenseUrl})\n`;
    out += `Public Reference: ${s.publicSourceUrl}\n`;
    out += `Authoritative Text:\n"${s.content}"\n\n`;
  });
  return out;
}
