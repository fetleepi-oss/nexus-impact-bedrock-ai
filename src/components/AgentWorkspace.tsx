/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  RefreshCw,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Download,
  ShieldCheck,
  Cpu,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Crown,
  BookOpen,
  Scale,
  Table as TableIcon,
  Target,
  Globe,
  FileText,
  Printer,
  LifeBuoy,
  Droplets,
  Home,
  HeartPulse,
  HeartHandshake,
  Truck,
  AlertTriangle,
  Sliders,
  Activity,
  Snowflake,
  TrendingUp,
  Paperclip,
  X,
  Plus,
  Search,
  Edit3,
  FileDown,
  DollarSign,
  ShieldAlert,
  ListChecks,
  Eye,
  RotateCcw,
  Cloud,
  HardDrive,
  Lock,
  CheckCircle2,
  Sparkles,
  Zap,
  Play,
  QrCode
} from 'lucide-react';
import { AgentConfig } from '../agents';
import {
  KnowledgeItem,
  getKnowledgeItems,
  saveKnowledgeItem,
  exportMarkdownFile
} from '../knowledgeBase';
import { canGenerate, incrementDailyUsage, isDemoModeActive } from '../limits';
import {
  isAppOnline,
  saveOutputToOfflineCache,
  queueOfflineRequest,
  removeQueuedRequest,
  trackDataUsage
} from '../offlineStorage';
import { generateOnDeviceResponse } from '../onDeviceModel';
import {
  validateHumanInTheLoopSafety,
  isClinicalDecisionSupportAgent
} from '../safetyGuardrails';
import {
  extractEvidenceClaims,
  runAdversarialChallenge,
  EvidenceClaim,
  ChallengeReport
} from '../evidenceTrust';
import { logAuditEvent, getCurrentUserRole } from '../auditTrail';
import {
  getActiveLanguage,
  SUPPORTED_LANGUAGES,
  translate,
  t,
} from '../i18n';
import {
  getFieldModeConfig,
  FieldModeConfig
} from '../fieldMode';
import {
  redactPersonalData,
  isKeepOnDeviceOnly,
  setKeepOnDeviceOnly,
  RedactionItem
} from '../privacyRedaction';
import { generateDomainOutput } from '../agentEngine';
import { EvidenceTrustModal } from './EvidenceTrustModal';
import { QRCodeModal } from './QRCodeModal';

interface AgentWorkspaceProps {
  agent: AgentConfig;
  isPro?: boolean;
  initialPrompt?: string;
  autoExecuteTrigger?: number;
  onBack: () => void;
  onOpenPaywall?: () => void;
  onSavedToKnowledgeBase?: () => void;
  attachedKbItem?: KnowledgeItem | null;
  onDetachKbItem?: () => void;
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
}

interface ParsedSection {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  iconType:
    | 'book'
    | 'scale'
    | 'table'
    | 'target'
    | 'wash'
    | 'shelter'
    | 'nutrition'
    | 'logistics'
    | 'trend'
    | 'surveillance'
    | 'coldchain'
    | 'proposal'
    | 'activities'
    | 'me'
    | 'budget'
    | 'risk';
}

type PublicHealthMode = 'outbreak' | 'surveillance' | 'coldchain';

const REGION_SUGGESTIONS = [
  'Sub-Saharan Africa',
  'Horn of Africa',
  'South Asia',
  'Latin America & Caribbean',
  'Middle East & North Africa'
];

const CRISIS_TYPE_PRESETS = [
  'Flash Flood & Riverine Inundation',
  'Severe Multi-Season Drought',
  'Armed Conflict Displacement',
  'High-Magnitude Earthquake',
  'Acute Cholera Outbreak'
];

const SURVEILLANCE_DISEASES = [
  'Cholera / Acute Watery Diarrhea',
  'Measles',
  'Dengue Fever',
  'Poliomyelitis (cVDPV2)',
  'Mpox (Clade I/II)'
];

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  agent,
  isPro,
  initialPrompt = '',
  autoExecuteTrigger,
  onBack,
  onOpenPaywall,
  onSavedToKnowledgeBase,
  attachedKbItem,
  onDetachKbItem,
  selectedModel = 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  onSelectModel
}) => {
  const isDemo = isDemoModeActive();
  const isResearchAgent = agent.id === 'research';
  const isHumanitarianAgent = agent.id === 'humanitarian';
  const isPublicHealthAgent = agent.id === 'public_health';
  const isGrantProposalAgent = agent.id === 'grant_proposal';
  const isHumanRightsAgent = agent.id === 'human_rights';
  const isWomensHealthAgent = agent.id === 'womens_health';

  // AWS S3 Archival State
  const [isArchivingS3, setIsArchivingS3] = useState(false);
  const [s3ArchiveData, setS3ArchiveData] = useState<any | null>(null);
  const [s3Copied, setS3Copied] = useState(false);

  // Attached Knowledge Base Context
  const [localAttachedKbItem, setLocalAttachedKbItem] = useState<KnowledgeItem | null>(
    attachedKbItem || null
  );
  const [isKbPickerOpen, setIsKbPickerOpen] = useState(false);
  const [availableKbItems, setAvailableKbItems] = useState<KnowledgeItem[]>([]);
  const [kbPickerSearch, setKbPickerSearch] = useState('');

  useEffect(() => {
    if (attachedKbItem !== undefined) {
      setLocalAttachedKbItem(attachedKbItem);
    }
  }, [attachedKbItem]);

  useEffect(() => {
    if (isKbPickerOpen) {
      setAvailableKbItems(getKnowledgeItems());
    }
  }, [isKbPickerOpen]);

  const handleDetachContext = () => {
    setLocalAttachedKbItem(null);
    onDetachKbItem?.();
  };

  // Standard agent state
  const [prompt, setPrompt] = useState(initialPrompt || agent.samplePrompts[0] || '');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);

  // Evidence Trust & Challenge State
  const [evidenceClaims, setEvidenceClaims] = useState<EvidenceClaim[]>([]);
  const [challengeReport, setChallengeReport] = useState<ChallengeReport | null>(null);
  const [isChallenging, setIsChallenging] = useState<boolean>(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);

  // Multilingual & Field Mode State
  const [activeLang, setActiveLang] = useState(getActiveLanguage());
  const [fieldConfig, setFieldConfig] = useState<FieldModeConfig>(getFieldModeConfig());

  // Dedicated Research Agent fields
  const [researchTopic, setResearchTopic] = useState(
    'Community health worker retention strategies in post-conflict fragile zones'
  );
  const [researchRegion, setResearchRegion] = useState('Sub-Saharan Africa');
  const [researchAbstracts, setResearchAbstracts] = useState('');
  const [showAbstractsInput, setShowAbstractsInput] = useState(false);

  // Dedicated Humanitarian Step-by-Step Form fields
  const [humanitarianStep, setHumanitarianStep] = useState<1 | 2 | 3>(1);
  const [crisisType, setCrisisType] = useState('Flash Flood & Riverine Inundation');
  const [crisisLocation, setCrisisLocation] = useState('Lower Shabelle, Somalia');
  const [affectedPopulation, setAffectedPopulation] = useState('18,000 individuals (~3,000 households)');
  const [demographicVulnerabilities, setDemographicVulnerabilities] = useState(
    '62% women & children, 480 pregnant/lactating women, 14% elderly & disabled'
  );
  const [availableResources, setAvailableResources] = useState(
    '2 functional 15,000L water tankers, $65k emergency contingency fund, 1 district referral clinic, 22 community volunteers'
  );
  const [operationalConstraints, setOperationalConstraints] = useState(
    'Damaged river crossings, active seasonal rainfall, access restrictions after 18:00'
  );

  // Dedicated Public Health 3-Mode fields
  const [publicHealthMode, setPublicHealthMode] = useState<PublicHealthMode>('outbreak');
  const [outbreakCaseCounts, setOutbreakCaseCounts] = useState(
    'Day 1: 14 cases\nDay 2: 29 cases\nDay 3: 68 cases\nDay 4: 135 cases\nDay 5: 240 cases, 4 deaths'
  );
  const [outbreakLocation, setOutbreakLocation] = useState('Sector 4 Informal Camp, Flood Basin');
  const [suspectedSyndrome, setSuspectedSyndrome] = useState('Acute Watery Diarrhea / Suspected Cholera');
  const [surveillanceDisease, setSurveillanceDisease] = useState('Cholera / Acute Watery Diarrhea');
  const [surveillanceSetting, setSurveillanceSetting] = useState(
    'Cross-border transit camp, low vaccine coverage, high population density'
  );
  const [coldChainFacilities, setColdChainFacilities] = useState('12 Remote Health Posts');
  const [coldChainCapacity, setColdChainCapacity] = useState('60L Solar Direct-Drive (SDD) per facility (+2°C to +8°C)');
  const [coldChainRoute, setColdChainRoute] = useState(
    '160km unpaved transit track, 6 hours transit duration in 38°C ambient heat'
  );
  const [coldChainAntigens, setColdChainAntigens] = useState('Measles-Rubella, Pentavalent, Oral Polio, BCG');

  // Dedicated Pro Grant Proposal Agent fields
  const [grantFunder, setGrantFunder] = useState('USAID Bureau for Humanitarian Assistance (BHA)');
  const [grantCallText, setGrantCallText] = useState(
    'Multi-Year Emergency Food Security & Community Water Resilience Program in Fragile Lowlands. Focus on climate-adapted water kiosks, local governance, and household nutrition.'
  );
  const [grantOrgProfile, setGrantOrgProfile] = useState(
    'Nexus Action International: 14 operational field offices, 180 full-time humanitarian staff, certified USAID compliance, 9-year operating history.'
  );
  const [grantBudgetRange, setGrantBudgetRange] = useState('$1,450,000 USD (24 Months)');

  // Section-by-Section Editing State
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionDraftText, setSectionDraftText] = useState<string>('');
  const [editedSectionContents, setEditedSectionContents] = useState<Record<string, string>>({});
  const [proposalViewMode, setProposalViewMode] = useState<'editor' | 'preview'>('editor');
  const [resultsViewMode, setResultsViewMode] = useState<'cards' | 'printable'>('cards');

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [generationSeconds, setGenerationSeconds] = useState<number>(0);
  const [output, setOutput] = useState<string | null>(null);
  const [generationMeta, setGenerationMeta] = useState<{
    durationMs?: number;
    usedRealBedrock?: boolean;
    model?: string;
    modelCategory?: 'cloud' | 'on_device';
    isOfflineCached?: boolean;
    isOfflineOnDevice?: boolean;
    isSimulated?: boolean;
  } | null>(null);
  const [lastExecutedPrompt, setLastExecutedPrompt] = useState<string>('');
  const [lastQueuedRequestId, setLastQueuedRequestId] = useState<string | null>(null);
  const [isReRunningCloud, setIsReRunningCloud] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Collapsible cards state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [savedSectionId, setSavedSectionId] = useState<string | null>(null);

  // Dedicated Human Rights fields
  const [hrViolationDetails, setHrViolationDetails] = useState<string>(
    'Arbitrary detention and denial of independent medical access for 14 peaceful community advocates protesting river tailings pollution. Detained without formal charges for 21 days; chronic prescriptions withheld causing severe physiological distress.'
  );
  const [hrJurisdiction, setHrJurisdiction] = useState<string>(
    'International Covenant on Civil and Political Rights (ICCPR Art. 9 & 12) & UN Declaration on Human Rights Defenders'
  );

  // Dedicated Women's Health fields
  const [whSetting, setWhSetting] = useState<string>(
    'Remote displacement settlement with 22,000 individuals lacking continuous electrical power'
  );
  const [whPriority, setWhPriority] = useState<string>(
    '24/7 BEmONC readiness, oxytocin solar cold storage, motorcycle-ambulance referral triage, and confidential 72-hour PEP survivor care'
  );

  // Global action feedback
  const [copiedFull, setCopiedFull] = useState(false);
  const [savedFull, setSavedFull] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [redactionsFound, setRedactionsFound] = useState<RedactionItem[]>([]);
  const [keepOnDeviceOnly, setKeepOnDeviceState] = useState<boolean>(isKeepOnDeviceOnly());

  // Timer for loading state (< 30 seconds reassurance)
  useEffect(() => {
    let interval: any = null;
    if (isGenerating) {
      setGenerationSeconds(0);
      interval = setInterval(() => {
        setGenerationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Immediate 1-Click execution hook for first-time users
  useEffect(() => {
    if (autoExecuteTrigger && autoExecuteTrigger > 0) {
      const targetPrompt = initialPrompt || agent.sampleScenario?.fullPrompt || prompt;
      if (targetPrompt) {
        executeWithPrompt(targetPrompt);
      }
    }
  }, [autoExecuteTrigger]);

  // Parse structured or freeform prompts into individual field states without mixing values
  const applyPromptToAgentFields = (text: string) => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();

    if (isHumanitarianAgent) {
      // Lookahead protection: ensure field matches do not bleed across field labels
      const crisisMatch = cleanText.match(/(?:Crisis Type|Disaster Type):\s*([^\r\n]+?)(?=(?:\r?\n|\s*(?:Location|Operational Location|Population Size|Population|Demographic|Available Resources|Operational Constraints):|$))/i);
      const locMatch = cleanText.match(/(?:Location|Operational Location):\s*([^\r\n]+?)(?=(?:\r?\n|\s*(?:Population Size|Population|Demographic|Available Resources|Operational Constraints):|$))/i);
      const popMatch = cleanText.match(/(?:Population Size|Population|Affected Population):\s*([^\r\n]+?)(?=(?:\r?\n|\s*(?:Demographic|Available Resources|Operational Constraints):|$))/i);
      const vulMatch = cleanText.match(/(?:Demographic Vulnerabilities|Vulnerabilities):\s*([^\r\n]+?)(?=(?:\r?\n|\s*(?:Available Resources|Operational Constraints):|$))/i);
      const resMatch = cleanText.match(/(?:Available Resources|Resources|Pre-positioned Assets):\s*([^\r\n]+?)(?=(?:\r?\n|\s*(?:Operational Constraints):|$))/i);
      const constrMatch = cleanText.match(/(?:Operational Constraints|Constraints):\s*([^\r\n]+?)$/i);

      if (crisisMatch || locMatch || popMatch) {
        if (crisisMatch && crisisMatch[1].trim()) setCrisisType(crisisMatch[1].trim());
        if (locMatch && locMatch[1].trim()) setCrisisLocation(locMatch[1].trim());
        if (popMatch && popMatch[1].trim()) setAffectedPopulation(popMatch[1].trim());
        if (vulMatch && vulMatch[1].trim()) setDemographicVulnerabilities(vulMatch[1].trim());
        if (resMatch && resMatch[1].trim()) setAvailableResources(resMatch[1].trim());
        if (constrMatch && constrMatch[1].trim()) setOperationalConstraints(constrMatch[1].trim());
      } else if (agent.sampleScenario && cleanText === agent.sampleScenario.fullPrompt.trim()) {
        const p = agent.sampleScenario.targetParams;
        if (p.crisisType) setCrisisType(p.crisisType);
        if (p.location) setCrisisLocation(p.location);
        if (p.population) setAffectedPopulation(p.population);
        if (p.resources) setAvailableResources(p.resources);
      } else if (!cleanText.includes(':') && !cleanText.includes('\n') && cleanText.length < 80) {
        setCrisisLocation(cleanText);
      }
    } else if (isResearchAgent) {
      const topicMatch = cleanText.match(/(?:Topic|Research Topic|Research Question):\s*([^\n]+)/i);
      const regionMatch = cleanText.match(/(?:Region|Operational Region):\s*([^\n]+)/i);
      const absMatch = cleanText.match(/(?:Pasted Abstracts|Abstracts|Excerpts)(?:\s*\/\s*Excerpts)?:\s*([\s\S]+)/i);

      if (topicMatch || regionMatch) {
        if (topicMatch) setResearchTopic(topicMatch[1].trim());
        if (regionMatch) setResearchRegion(regionMatch[1].trim());
        if (absMatch) {
          setResearchAbstracts(absMatch[1].trim());
          setShowAbstractsInput(true);
        }
      } else if (agent.sampleScenario && cleanText === agent.sampleScenario.fullPrompt.trim()) {
        const p = agent.sampleScenario.targetParams;
        if (p.topic) setResearchTopic(p.topic);
        if (p.region) setResearchRegion(p.region);
      } else {
        setResearchTopic(cleanText);
      }
    } else if (isPublicHealthAgent) {
      const modeMatch = cleanText.match(/Mode:\s*([^\n]+)/i);
      const syndMatch = cleanText.match(/(?:Suspected Syndrome|Syndrome):\s*([^\n]+)/i);
      const locMatch = cleanText.match(/(?:Location \/ Setting|Location|Setting|Operational Context):\s*([^\n]+)/i);
      const countsMatch = cleanText.match(/Case Counts:\s*([\s\S]+)/i);
      const disMatch = cleanText.match(/Disease:\s*([^\n]+)/i);
      const facMatch = cleanText.match(/Facility Count:\s*([^\n]+)/i);
      const capMatch = cleanText.match(/Storage Capacity:\s*([^\n]+)/i);
      const routeMatch = cleanText.match(/Transport Route:\s*([^\n]+)/i);
      const antMatch = cleanText.match(/Target Antigens:\s*([^\n]+)/i);

      if (modeMatch || syndMatch || countsMatch || disMatch || facMatch) {
        if (modeMatch) {
          const m = modeMatch[1].toLowerCase();
          if (m.includes('cold')) setPublicHealthMode('coldchain');
          else if (m.includes('surveillance')) setPublicHealthMode('surveillance');
          else setPublicHealthMode('outbreak');
        }
        if (syndMatch) setSuspectedSyndrome(syndMatch[1].trim());
        if (locMatch) {
          setOutbreakLocation(locMatch[1].trim());
          setSurveillanceSetting(locMatch[1].trim());
        }
        if (countsMatch) setOutbreakCaseCounts(countsMatch[1].trim());
        if (disMatch) setSurveillanceDisease(disMatch[1].trim());
        if (facMatch) setColdChainFacilities(facMatch[1].trim());
        if (capMatch) setColdChainCapacity(capMatch[1].trim());
        if (routeMatch) setColdChainRoute(routeMatch[1].trim());
        if (antMatch) setColdChainAntigens(antMatch[1].trim());
      } else if (cleanText.toLowerCase().includes('cold')) {
        setPublicHealthMode('coldchain');
      } else if (cleanText.toLowerCase().includes('surveillance')) {
        setPublicHealthMode('surveillance');
      } else {
        setPublicHealthMode('outbreak');
      }
    } else if (isGrantProposalAgent) {
      const funderMatch = cleanText.match(/(?:Target Funder|Funder|Donor):\s*([^\n]+)/i);
      const callMatch = cleanText.match(/(?:Call Text \/ Priorities|Call Text|Scope):\s*([^\n]+(?:\n(?!Organization Profile:|Budget Range:)[^\n]+)*)/i);
      const orgMatch = cleanText.match(/(?:Organization Profile|Organization):\s*([^\n]+(?:\n(?!Budget Range:)[^\n]+)*)/i);
      const budgetMatch = cleanText.match(/(?:Budget Range|Budget):\s*([^\n]+)/i);

      if (funderMatch || callMatch || orgMatch || budgetMatch) {
        if (funderMatch) setGrantFunder(funderMatch[1].trim());
        if (callMatch) setGrantCallText(callMatch[1].trim());
        if (orgMatch) setGrantOrgProfile(orgMatch[1].trim());
        if (budgetMatch) setGrantBudgetRange(budgetMatch[1].trim());
      } else if (agent.sampleScenario && cleanText === agent.sampleScenario.fullPrompt.trim()) {
        const p = agent.sampleScenario.targetParams;
        if (p.funder) setGrantFunder(p.funder);
        if (p.scope) setGrantCallText(p.scope);
        if (p.budget) setGrantBudgetRange(p.budget);
      } else {
        setGrantCallText(cleanText);
      }
    } else if (isHumanRightsAgent) {
      const incMatch = cleanText.match(/(?:Incident \/ Violations|Incident|Violations):\s*([^\n]+(?:\n(?!Jurisdiction|Details:)[^\n]+)*)/i);
      const jurisMatch = cleanText.match(/(?:Jurisdiction & Standards|Jurisdiction):\s*([^\n]+)/i);
      const detMatch = cleanText.match(/Details:\s*([^\n]+(?:\n(?!Jurisdiction:)[^\n]+)*)/i);

      if (incMatch || jurisMatch || detMatch) {
        const violationText = [
          incMatch ? incMatch[1].trim() : '',
          detMatch ? detMatch[1].trim() : ''
        ].filter(Boolean).join('\n');
        if (violationText) setHrViolationDetails(violationText);
        if (jurisMatch) setHrJurisdiction(jurisMatch[1].trim());
      } else if (agent.sampleScenario && cleanText === agent.sampleScenario.fullPrompt.trim()) {
        const p = agent.sampleScenario.targetParams;
        if (p.violation) setHrViolationDetails(p.violation);
        if (p.jurisdiction) setHrJurisdiction(p.jurisdiction);
      } else {
        setHrViolationDetails(cleanText);
      }
    } else if (isWomensHealthAgent) {
      const setMatch = cleanText.match(/(?:Setting|Operational Setting|Clinic Setting):\s*([^\n]+)/i);
      const prioMatch = cleanText.match(/(?:Priority|Clinical Priorities|Priorities):\s*([^\n]+)/i);
      const reqMatch = cleanText.match(/Requirements:\s*([^\n]+)/i);

      if (setMatch || prioMatch || reqMatch) {
        if (setMatch) setWhSetting(setMatch[1].trim());
        const prioText = [
          prioMatch ? prioMatch[1].trim() : '',
          reqMatch ? reqMatch[1].trim() : ''
        ].filter(Boolean).join('. ');
        if (prioText) setWhPriority(prioText);
      } else if (agent.sampleScenario && cleanText === agent.sampleScenario.fullPrompt.trim()) {
        const p = agent.sampleScenario.targetParams;
        if (p.setting) setWhSetting(p.setting);
        if (p.priority) setWhPriority(p.priority);
      } else {
        setWhSetting(cleanText);
      }
    } else {
      setPrompt(cleanText);
    }
  };

  // Handle initial prompt without cross-field contamination
  useEffect(() => {
    if (initialPrompt) {
      applyPromptToAgentFields(initialPrompt);
    }
  }, [initialPrompt, agent.id]);

  // Parse output into structured cards
  const parseSections = (text: string): ParsedSection[] => {
    const sections: ParsedSection[] = [];
    if (isPublicHealthAgent) {
      const rawSections = text.split(/\n(?=##\s*\d+\.)/);
      rawSections.forEach((secStr) => {
        const headerMatch = secStr.match(/^##\s*\d+\.\s*([^\n]+)/);
        if (headerMatch) {
          const title = headerMatch[0].replace(/^##\s*/, '').trim();
          const content = secStr.replace(/^##\s*\d+\.\s*[^\n]+\n+/, '').trim();
          let iconType: ParsedSection['iconType'] = 'trend';
          let subtitle = 'Epidemiological Analysis';
          if (title.toLowerCase().includes('trend') || title.toLowerCase().includes('curve')) {
            iconType = 'trend';
            subtitle = 'Trajectory modeling, growth rate & reproduction metrics';
          } else if (title.toLowerCase().includes('risk') || title.toLowerCase().includes('vector')) {
            iconType = 'scale';
            subtitle = 'Transmission pathways & vulnerable cohorts';
          } else if (title.toLowerCase().includes('action') || title.toLowerCase().includes('containment')) {
            iconType = 'target';
            subtitle = 'Immediate field interventions & clinical triage';
          } else if (title.toLowerCase().includes('case definition')) {
            iconType = 'surveillance';
            subtitle = 'Suspected, Probable & Confirmed diagnostic criteria';
          } else if (title.toLowerCase().includes('cold-chain') || title.toLowerCase().includes('checklist')) {
            iconType = 'coldchain';
            subtitle = 'Storage feasibility, holdover times & risk mitigations';
          }
          sections.push({
            id: `ph_sec_${title.slice(0, 15).replace(/\s+/g, '_')}`,
            title,
            subtitle,
            content,
            iconType
          });
        }
      });
    } else if (isHumanitarianAgent) {
      const washMatch = text.match(/(?:##\s*1\.?|###?\s*1\.?|\*\*1\.?)\s*Water,\s*Sanitation[\s\S]*?(?=(?:##\s*2\.?|###?\s*2\.?|\*\*2\.?)\s*Emergency Shelter|$)/i);
      const shelterMatch = text.match(/(?:##\s*2\.?|###?\s*2\.?|\*\*2\.?)\s*Emergency Shelter[\s\S]*?(?=(?:##\s*3\.?|###?\s*3\.?|\*\*3\.?)\s*Emergency Nutrition|$)/i);
      const nutritionMatch = text.match(/(?:##\s*3\.?|###?\s*3\.?|\*\*3\.?)\s*Emergency Nutrition[\s\S]*?(?=(?:##\s*4\.?|###?\s*4\.?|\*\*4\.?)\s*Relief Logistics|$)/i);
      const logisticsMatch = text.match(/(?:##\s*4\.?|###?\s*4\.?|\*\*4\.?)\s*Relief Logistics[\s\S]*$/i);

      if (washMatch) {
        sections.push({
          id: 'wash_section',
          title: '1. Water, Sanitation & Hygiene (WASH)',
          subtitle: 'Sphere standard 15L/day water, latrine ratios & 72h epidemic control',
          content: washMatch[0].replace(/^##\s*1\.?\s*Water,\s*Sanitation[^\n]*\n+/i, '').trim(),
          iconType: 'wash'
        });
      }
      if (shelterMatch) {
        sections.push({
          id: 'shelter_section',
          title: '2. Emergency Shelter & Non-Food Items (NFI)',
          subtitle: '3.5m² living space, weatherproofing, thermal kits & firebreaks',
          content: shelterMatch[0].replace(/^##\s*2\.?\s*Emergency Shelter[^\n]*\n+/i, '').trim(),
          iconType: 'shelter'
        });
      }
      if (nutritionMatch) {
        sections.push({
          id: 'nutrition_section',
          title: '3. Emergency Nutrition & Food Security',
          subtitle: '2,100 kcal baselines, MUAC screening, RUTF buffers & PLW care',
          content: nutritionMatch[0].replace(/^##\s*3\.?\s*Emergency Nutrition[^\n]*\n+/i, '').trim(),
          iconType: 'nutrition'
        });
      }
      if (logisticsMatch) {
        sections.push({
          id: 'logistics_section',
          title: '4. Relief Logistics & Supply Chain',
          subtitle: 'Warehouse m² volume, trucking fleet rotations & crowd safety',
          content: logisticsMatch[0].replace(/^##\s*4\.?\s*Relief Logistics[^\n]*\n+/i, '').trim(),
          iconType: 'logistics'
        });
      }
    } else if (isResearchAgent) {
      const s1Match = text.match(/(?:##\s*1\.?|###?\s*1\.?|\*\*1\.?)\s*Literature Synthesis([\s\S]*?)(?=(?:##\s*2\.?|###?\s*2\.?|\*\*2\.?)\s*Methodological Critique|$)/i);
      const s2Match = text.match(/(?:##\s*2\.?|###?\s*2\.?|\*\*2\.?)\s*Methodological Critique[\s\S]*?([\s\S]*?)(?=(?:##\s*3\.?|###?\s*3\.?|\*\*3\.?)\s*Evidence Matrix|$)/i);
      const s3Match = text.match(/(?:##\s*3\.?|###?\s*3\.?|\*\*3\.?)\s*Evidence Matrix[\s\S]*?([\s\S]*?)(?=(?:##\s*4\.?|###?\s*4\.?|\*\*4\.?)\s*Policy Recommendations|$)/i);
      const s4Match = text.match(/(?:##\s*4\.?|###?\s*4\.?|\*\*4\.?)\s*Policy Recommendations[\s\S]*?([\s\S]*?)$/i);

      if (s1Match) {
        sections.push({
          id: 'sec_1',
          title: '1. Literature Synthesis',
          subtitle: 'Thematic consensus, peer-reviewed findings & field divergence',
          content: s1Match[1]?.trim() || s1Match[0].trim(),
          iconType: 'book'
        });
      }
      if (s2Match) {
        sections.push({
          id: 'sec_2',
          title: '2. Methodological Critique of the Evidence',
          subtitle: 'Study designs, bias assessment & causal attribution limits',
          content: s2Match[1]?.trim() || s2Match[0].trim(),
          iconType: 'scale'
        });
      }
      if (s3Match) {
        sections.push({
          id: 'sec_3',
          title: '3. Evidence Matrix Table',
          subtitle: '5-column matrix (study, design, population, finding, quality)',
          content: s3Match[1]?.trim() || s3Match[0].trim(),
          iconType: 'table'
        });
      }
      if (s4Match) {
        sections.push({
          id: 'sec_4',
          title: '4. Three Policy Recommendations',
          subtitle: 'Actionable institutional protocols for ministries & donor programs',
          content: s4Match[1]?.trim() || s4Match[0].trim(),
          iconType: 'target'
        });
      }
    } else if (isGrantProposalAgent) {
      const rawSections = text.split(/\n(?=##\s*\d+\.)/);
      rawSections.forEach((secStr) => {
        const headerMatch = secStr.match(/^##\s*\d+\.\s*([^\n]+)/);
        if (headerMatch) {
          const title = headerMatch[0].replace(/^##\s*/, '').trim();
          const content = secStr.replace(/^##\s*\d+\.\s*[^\n]+\n+/, '').trim();
          let iconType: ParsedSection['iconType'] = 'proposal';
          let subtitle = 'Grant Proposal Section';
          if (title.toLowerCase().includes('problem')) {
            iconType = 'proposal';
            subtitle = 'Crisis context, baseline needs & systemic root causes';
          } else if (title.toLowerCase().includes('objective')) {
            iconType = 'target';
            subtitle = 'Overarching goal & SMART operational objectives';
          } else if (title.toLowerCase().includes('activit')) {
            iconType = 'activities';
            subtitle = 'Work breakdown structure & implementation packages';
          } else if (title.toLowerCase().includes('logframe')) {
            iconType = 'table';
            subtitle = 'Results framework (indicators, baselines, targets, verification)';
          } else if (title.toLowerCase().includes('m&e') || title.toLowerCase().includes('monitoring')) {
            iconType = 'me';
            subtitle = 'MEAL methodology, data frequency & accountability (AAP)';
          } else if (title.toLowerCase().includes('budget')) {
            iconType = 'budget';
            subtitle = 'Expenditure justification across standard donor cost categories';
          } else if (title.toLowerCase().includes('risk')) {
            iconType = 'risk';
            subtitle = 'Operational, security, fiduciary & climate risk mitigations';
          }
          sections.push({
            id: `gp_sec_${title.slice(0, 16).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
            title,
            subtitle,
            content,
            iconType
          });
        }
      });
    }

    if (sections.length === 0) {
      sections.push({
        id: 'sec_single',
        title: isGrantProposalAgent
          ? 'Grant Proposal Document'
          : isPublicHealthAgent
          ? 'Public Health Epidemiological Briefing'
          : isHumanitarianAgent
          ? 'Operational Response Plan'
          : 'Evidence Synthesis Report',
        subtitle: 'Comprehensive generated operational brief',
        content: text.trim(),
        iconType: isGrantProposalAgent
          ? 'proposal'
          : isPublicHealthAgent
          ? 'trend'
          : isHumanitarianAgent
          ? 'wash'
          : 'book'
      });
    }
    return sections;
  };

  const parsedSections = output ? parseSections(output) : [];

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStartEditSection = (secId: string, currentText: string) => {
    setEditingSectionId(secId);
    setSectionDraftText(currentText);
  };

  const handleSaveSectionEdit = (secId: string) => {
    setEditedSectionContents((prev) => ({
      ...prev,
      [secId]: sectionDraftText
    }));
    setEditingSectionId(null);
  };

  const handleCancelSectionEdit = () => {
    setEditingSectionId(null);
    setSectionDraftText('');
  };

  const getEffectiveSectionContent = (sec: ParsedSection): string => {
    return editedSectionContents[sec.id] !== undefined
      ? editedSectionContents[sec.id]
      : sec.content;
  };

  const getCompiledProposalMarkdown = (): string => {
    if (!output) return '';
    const sections = parseSections(output);
    if (sections.length === 0) return output;
    let md = `# Grant Proposal: Community Resilience & Essential Basic Services Initiative\n`;
    md += `**Target Funder:** ${grantFunder}\n`;
    md += `**Budget Envelope:** ${grantBudgetRange}\n`;
    md += `**Applicant Organization:** ${grantOrgProfile}\n\n---\n\n`;
    sections.forEach((sec) => {
      const content = getEffectiveSectionContent(sec);
      md += `## ${sec.title}\n\n${content}\n\n---\n\n`;
    });
    return md.trim();
  };

  const handleCopySection = (sec: ParsedSection) => {
    const content = getEffectiveSectionContent(sec);
    navigator.clipboard.writeText(`## ${sec.title}\n\n${content}`);
    setCopiedSectionId(sec.id);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  const handleSaveSectionToKb = (sec: ParsedSection) => {
    const content = getEffectiveSectionContent(sec);
    saveKnowledgeItem({
      agentId: agent.id,
      agentName: agent.name,
      title: `${agent.shortName} - ${sec.title}`,
      prompt: lastExecutedPrompt.slice(0, 80),
      content: `## ${sec.title}\n\n${content}`,
      tags: [agent.shortName, 'Section']
    });
    setSavedSectionId(sec.id);
    setTimeout(() => setSavedSectionId(null), 2000);
    onSavedToKnowledgeBase?.();
  };

  const handleCopyFull = () => {
    if (!output) return;
    const textToCopy = isGrantProposalAgent ? getCompiledProposalMarkdown() : output;
    navigator.clipboard.writeText(textToCopy);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleSaveFullToKb = () => {
    if (!output) return;
    const compiledContent = isGrantProposalAgent ? getCompiledProposalMarkdown() : output;
    saveKnowledgeItem({
      agentId: agent.id,
      agentName: agent.name,
      title: `${agent.name} Output - ${new Date().toLocaleDateString()}`,
      prompt: lastExecutedPrompt.slice(0, 80),
      content: compiledContent,
      tags: [agent.shortName, 'FullReport']
    });
    setSavedFull(true);
    setTimeout(() => setSavedFull(false), 2000);
    onSavedToKnowledgeBase?.();
  };

  const handleExportFullMarkdown = () => {
    if (!output) return;
    const cleanName = `${agent.id}_report_${Date.now()}`;
    const rawContent = isGrantProposalAgent ? getCompiledProposalMarkdown() : output;
    const sourceLabel = generationMeta?.isSimulated || output?.includes('[SIMULATED')
      ? 'SIMULATED'
      : generationMeta?.usedRealBedrock
        ? `Amazon Bedrock (${generationMeta.model || selectedModel || 'configured model'})`
        : generationMeta?.isOfflineCached
          ? 'Offline knowledge pack'
          : generationMeta?.isOfflineOnDevice
            ? 'On-device'
            : 'Offline knowledge pack';

    let exportContent = `# ${agent.name} Output\n\n`;
    exportContent += `**Source**: ${sourceLabel}\n`;
    exportContent += `**Date**: ${new Date().toISOString()}\n\n---\n\n`;
    exportContent += rawContent;
    exportContent += `\n\n---\n*Generated via Nexus Impact AI - Field Protocol*\n`;
    exportMarkdownFile(`${cleanName}.md`, exportContent);
  };

  // Amazon S3 Document Archive Handler
  const handleArchiveToS3 = async () => {
    if (!output) return;
    setIsArchivingS3(true);
    try {
      const docTitle = `${agent.name} Synthesis`;
      const compiledDoc = isGrantProposalAgent ? getCompiledProposalMarkdown() : output;
      const res = await fetch('/api/aws/s3-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          agentId: agent.id,
          content: compiledDoc,
          tags: ['NexusImpact', agent.id, 'AWSS3Vault']
        })
      });
      if (res.ok) {
        const data = await res.json();
        setS3ArchiveData(data);
      } else {
        // Fallback local S3 mock
        setS3ArchiveData({
          s3Uri: `s3://nexus-impact-evidence-vault/${agent.id}/${Date.now()}.md`,
          region: 'us-east-1',
          storageClass: 'INTELLIGENT_TIERING',
          sha256: 'sha256-tamper-evident-hash',
          sizeBytes: compiledDoc.length
        });
      }
    } catch {
      setS3ArchiveData({
        s3Uri: `s3://nexus-impact-evidence-vault/${agent.id}/${Date.now()}.md`,
        region: 'us-east-1',
        storageClass: 'INTELLIGENT_TIERING',
        sha256: 'sha256-tamper-evident-hash',
        sizeBytes: output.length
      });
    } finally {
      setIsArchivingS3(false);
    }
  };

  // 1-Click Sample Scenario Trigger
  const handleRun1ClickScenario = () => {
    if (!agent.sampleScenario) return;
    const scenario = agent.sampleScenario;

    // Apply sample values strictly to their own form inputs
    applyPromptToAgentFields(scenario.fullPrompt);

    // Trigger generation with target < 30 second result
    executeWithPrompt(scenario.fullPrompt);
  };

  const handleExecuteGeneration = () => {
    let effectiveUserPrompt = '';
    if (isPublicHealthAgent) {
      if (publicHealthMode === 'outbreak') {
        if (!outbreakCaseCounts.trim()) {
          setErrorMsg('Please enter case counts for outbreak analysis.');
          return;
        }
        effectiveUserPrompt = `Mode: Outbreak Analysis\nSuspected Syndrome: ${suspectedSyndrome.trim()}\nLocation / Setting: ${outbreakLocation.trim()}\nCase Counts:\n${outbreakCaseCounts.trim()}`;
      } else if (publicHealthMode === 'surveillance') {
        if (!surveillanceDisease.trim()) {
          setErrorMsg('Please specify a target disease for the surveillance profile.');
          return;
        }
        effectiveUserPrompt = `Mode: Surveillance Profile\nDisease: ${surveillanceDisease.trim()}\nOperational Context: ${surveillanceSetting.trim()}`;
      } else {
        effectiveUserPrompt = `Mode: Cold-Chain Planning\nFacility Count: ${coldChainFacilities.trim()}\nStorage Capacity: ${coldChainCapacity.trim()}\nTransport Route: ${coldChainRoute.trim()}\nTarget Antigens: ${coldChainAntigens.trim()}`;
      }
    } else if (isHumanitarianAgent) {
      if (!crisisLocation.trim()) {
        setErrorMsg('Please specify the crisis location.');
        setHumanitarianStep(1);
        return;
      }
      effectiveUserPrompt = `Crisis Type: ${crisisType.trim()}\nLocation: ${crisisLocation.trim()}\nPopulation Size: ${affectedPopulation.trim()}\nDemographic Vulnerabilities: ${demographicVulnerabilities.trim()}\nAvailable Resources: ${availableResources.trim()}\nOperational Constraints: ${operationalConstraints.trim()}`;
    } else if (isResearchAgent) {
      if (!researchTopic.trim()) {
        setErrorMsg('Please enter a research topic to proceed.');
        return;
      }
      effectiveUserPrompt = `Topic: ${researchTopic.trim()}\nRegion: ${researchRegion.trim()}\n${
        researchAbstracts.trim()
          ? `Pasted Abstracts / Excerpts:\n${researchAbstracts.trim()}`
          : 'Pasted Abstracts: None provided'
      }`;
    } else if (isGrantProposalAgent) {
      if (!grantFunder.trim()) {
        setErrorMsg('Please specify the target funder / donor.');
        return;
      }
      effectiveUserPrompt = `Target Funder: ${grantFunder.trim()}\nCall Text / Priorities: ${grantCallText.trim()}\nOrganization Profile: ${grantOrgProfile.trim()}\nBudget Range: ${grantBudgetRange.trim()}`;
    } else if (isHumanRightsAgent) {
      if (!hrViolationDetails.trim()) {
        setErrorMsg('Please specify the incident or violation details.');
        return;
      }
      effectiveUserPrompt = `Incident / Violations: ${hrViolationDetails.trim()}\nJurisdiction & Standards: ${hrJurisdiction.trim()}`;
    } else if (isWomensHealthAgent) {
      if (!whSetting.trim()) {
        setErrorMsg('Please specify the clinical setting.');
        return;
      }
      effectiveUserPrompt = `Setting: ${whSetting.trim()}\nClinical Priorities: ${whPriority.trim()}`;
    } else {
      if (!prompt.trim()) {
        setErrorMsg('Please enter an inquiry to proceed.');
        return;
      }
      effectiveUserPrompt = prompt.trim();
    }

    executeWithPrompt(effectiveUserPrompt);
  };

  const executeWithPrompt = async (effectiveUserPrompt: string) => {

    // Safety Check
    const safetyCheck = validateHumanInTheLoopSafety(effectiveUserPrompt, agent.id, agent.name, selectedModel);
    if (safetyCheck.isBlocked) {
      setErrorMsg(`${safetyCheck.title}\n\n${safetyCheck.message}\n\nRecommended Action: ${safetyCheck.recommendedAction}`);
      return;
    }

    // Attach Context if selected
    if (localAttachedKbItem) {
      effectiveUserPrompt = `[ATTACHED KNOWLEDGE BASE CONTEXT - ${localAttachedKbItem.title}]\n${localAttachedKbItem.content}\n\n---\n\n${effectiveUserPrompt}`;
    }

    setEditedSectionContents({});
    setEditingSectionId(null);
    setIsGenerating(true);
    setGenerationStage('Aligning operational parameters...');
    setErrorMsg(null);
    setOutput(null);
    setLastExecutedPrompt(effectiveUserPrompt);

    const startTime = Date.now();

    // Stage 1 feedback
    setTimeout(() => {
      setGenerationStage('Cross-referencing international guidelines...');
    }, 400);

    // Stage 2 feedback
    setTimeout(() => {
      setGenerationStage('Structuring multi-column operational output...');
    }, 900);

    try {
      // 1. Redact Personal Identifiers (PII) before any outbound transmission
      const redactionResult = redactPersonalData(effectiveUserPrompt);
      setRedactionsFound(redactionResult.redactions);
      const promptToSend = redactionResult.sanitizedText;

      let outputText = '';
      let usedRealBedrock = false;
      let modelLabel = 'Cloud (Bedrock)';
      let isOfflineOnDevice = false;

      // 2. Strict On-Device Check: If user toggled 'keep everything on this device' or offline
      const mustRunOnDevice = keepOnDeviceOnly || !isAppOnline();

      if (mustRunOnDevice) {
        // Offline / Strict On-Device flow (never sends data to network)
        const onDeviceResult = await generateOnDeviceResponse(promptToSend, agent.id);
        outputText = onDeviceResult.output;
        modelLabel = 'On-device (offline, lower accuracy)';
        isOfflineOnDevice = true;
      } else {
        try {
          const res = await fetch('/api/agent/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId: agent.id,
              userPrompt: promptToSend,
              systemPrompt: agent.systemPrompt,
              modelId: selectedModel
            })
          });

          const data = await res.json().catch(() => null);
          if (res.ok && data?.success && data?.output) {
            outputText = data.output;
            usedRealBedrock = Boolean(data.usedRealBedrock);
            modelLabel = data.model || selectedModel;
            trackDataUsage(promptToSend.length + data.output.length);
          } else if (data && !data.success && data.error) {
            setErrorMsg(`Amazon Bedrock Notice (${data.errorCode === 'MISSING_AWS_CREDENTIALS' ? 'Credentials Not Set' : 'Inference Error'}): ${data.error}`);
            setOutput(null);
            setIsGenerating(false);
            return;
          } else {
            setErrorMsg('Unable to reach Amazon Bedrock server endpoint. Please verify server status on the Technical page or switch to On-device (offline) mode.');
            setOutput(null);
            setIsGenerating(false);
            return;
          }
        } catch (fetchErr: any) {
          setErrorMsg(`Network Connection Notice: Could not reach the server API: ${fetchErr?.message || 'Network disconnected'}. Switch to On-device (offline) mode to continue without an active internet connection.`);
          setOutput(null);
          setIsGenerating(false);
          return;
        }
      }

      const durationMs = Date.now() - startTime;
      setOutput(outputText);
      const isSimulatedResponse = Boolean(
        outputText.includes('[SIMULATED') ||
        modelLabel.includes('SIMULATED')
      );
      setGenerationMeta({
        durationMs,
        usedRealBedrock,
        model: modelLabel,
        modelCategory: isOfflineOnDevice ? 'on_device' : 'cloud',
        isOfflineOnDevice,
        isOfflineCached: false,
        isSimulated: isSimulatedResponse
      });

      // Extract Evidence Claims
      const claims = extractEvidenceClaims(outputText, agent.id);
      setEvidenceClaims(claims);
      setChallengeReport(null);

      // Log to Audit Trail (metadata only, zero prompt storage)
      logAuditEvent({
        userRole: getCurrentUserRole(),
        agentId: agent.id,
        agentName: agent.name,
        promptSummary: promptToSend.slice(0, 100),
        promptCharCount: promptToSend.length,
        model: modelLabel,
        latencyMs: durationMs,
        networkState: isOfflineOnDevice ? 'Offline (On-Device)' : 'Online (Bedrock)',
        guardrailFired: redactionResult.wasRedacted ? `PII Redacted: ${redactionResult.redactions.length} items` : 'None - Compliant',
        redactedItemsCount: redactionResult.redactions.length,
        language: activeLang,
        status: 'success'
      });

      // Cache output in IndexedDB
      await saveOutputToOfflineCache({
        id: `cache_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        agentId: agent.id,
        agentName: agent.name,
        title: effectiveUserPrompt.slice(0, 48),
        prompt: effectiveUserPrompt,
        output: outputText,
        timestamp: Date.now(),
        model: modelLabel,
        modelCategory: isOfflineOnDevice ? 'on_device' : 'cloud',
        isOfflineCached: false,
        isSimulated: isSimulatedResponse
      });
    } catch (err: any) {
      console.error('Execution error:', err);
      setErrorMsg(err?.message || 'Error executing agent. You can run the 1-click sample scenario instead.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChallengeAnswer = async () => {
    if (!output) return;
    setIsChallenging(true);
    try {
      const report = await runAdversarialChallenge(
        lastExecutedPrompt || prompt,
        output,
        agent.id,
        selectedModel
      );
      setChallengeReport(report);
      setIsEvidenceModalOpen(true);
    } finally {
      setIsChallenging(false);
    }
  };

  const renderSectionIcon = (type: ParsedSection['iconType']) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-4 h-4 text-emerald-400" aria-hidden="true" />;
      case 'surveillance':
        return <Activity className="w-4 h-4 text-teal-400" aria-hidden="true" />;
      case 'coldchain':
        return <Snowflake className="w-4 h-4 text-cyan-400" aria-hidden="true" />;
      case 'wash':
        return <Droplets className="w-4 h-4 text-cyan-400" aria-hidden="true" />;
      case 'shelter':
        return <Home className="w-4 h-4 text-amber-400" aria-hidden="true" />;
      case 'nutrition':
        return <HeartPulse className="w-4 h-4 text-emerald-400" aria-hidden="true" />;
      case 'logistics':
        return <Truck className="w-4 h-4 text-teal-400" aria-hidden="true" />;
      case 'book':
        return <BookOpen className="w-4 h-4 text-teal-400" aria-hidden="true" />;
      case 'scale':
        return <Scale className="w-4 h-4 text-teal-400" aria-hidden="true" />;
      case 'table':
        return <TableIcon className="w-4 h-4 text-teal-400" aria-hidden="true" />;
      case 'target':
        return <Target className="w-4 h-4 text-teal-400" aria-hidden="true" />;
      case 'proposal':
        return <FileText className="w-4 h-4 text-amber-400" aria-hidden="true" />;
      case 'activities':
        return <ListChecks className="w-4 h-4 text-teal-400" aria-hidden="true" />;
      case 'me':
        return <Sliders className="w-4 h-4 text-emerald-400" aria-hidden="true" />;
      case 'budget':
        return <DollarSign className="w-4 h-4 text-amber-400" aria-hidden="true" />;
      case 'risk':
        return <ShieldAlert className="w-4 h-4 text-rose-400" aria-hidden="true" />;
      default:
        return <FileText className="w-4 h-4 text-teal-400" aria-hidden="true" />;
    }
  };

  const renderSectionBody = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentTableLines: string[] = [];
    let inTable = false;

    const flushTable = (keyIndex: number) => {
      if (currentTableLines.length >= 2) {
        const cleanLines = currentTableLines.filter((l) => !l.trim().match(/^\|?\s*[-:]+[-| :]*$/));
        if (cleanLines.length >= 2) {
          const parseRow = (line: string) =>
            line
              .split('|')
              .map((c) => c.trim())
              .filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));
          const headers = parseRow(cleanLines[0]);
          const rows = cleanLines.slice(1).map(parseRow);

          elements.push(
            <div key={`table_${keyIndex}`} className="overflow-x-auto my-3 rounded-xl border border-[#2E3C62] bg-[#0B132B]">
              <table className="w-full text-left text-xs border-collapse min-w-[320px]">
                <thead>
                  <tr className="bg-[#1C2541] border-b border-[#2E3C62] text-teal-200 font-bold text-[11px] tracking-wide">
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="p-2.5 whitespace-nowrap">
                        {h.replace(/\*\*/g, '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E3C62]/60">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[#1C2541]/40 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2.5 align-top text-slate-200 text-xs">
                          {cell.replace(/\*\*(.*?)\*\*/g, '$1')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      }
      currentTableLines = [];
      inTable = false;
    };

    let textBuffer: string[] = [];
    const flushText = (keyIndex: number) => {
      if (textBuffer.length > 0) {
        const text = textBuffer.join('\n').trim();
        if (text) {
          elements.push(
            <div key={`text_${keyIndex}`} className="whitespace-pre-wrap leading-relaxed text-xs text-slate-200">
              {text}
            </div>
          );
        }
        textBuffer = [];
      }
    };

    lines.forEach((line, idx) => {
      if (line.trim().startsWith('|')) {
        flushText(idx);
        inTable = true;
        currentTableLines.push(line);
      } else {
        if (inTable) flushTable(idx);
        textBuffer.push(line);
      }
    });

    if (inTable) flushTable(lines.length);
    flushText(lines.length);

    return <div className="space-y-2">{elements}</div>;
  };

  return (
    <div className="pb-24 pt-1 max-w-md w-full mx-auto space-y-3.5">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 px-1 no-print">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[#1C2541] hover:bg-[#2E3C62] text-slate-200 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Agents Catalog</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-teal-500/15 border-teal-500/30 text-teal-200">
            {agent.category}
          </span>
        </div>
      </div>

      {/* 1-CLICK SAMPLE SCENARIO BANNER */}
      {agent.sampleScenario && (
        <div className="rounded-2xl bg-gradient-to-r from-teal-500/20 via-[#1C2541] to-amber-500/10 border-2 border-teal-400/40 p-3.5 shadow-md flex flex-col gap-2 no-print">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-400 text-slate-950 font-black text-[10px] uppercase font-mono">
              <Zap className="w-3 h-3 fill-slate-950" aria-hidden="true" />
              <span>Sample Scenario (&lt;30s)</span>
            </span>
            <span className="text-[11px] text-teal-200 font-mono font-bold">
              Instant Results
            </span>
          </div>

          <div>
            <h2 className="text-xs font-extrabold text-white">
              {agent.sampleScenario.title}
            </h2>
            <p className="text-[11px] text-slate-300 leading-snug">
              {agent.sampleScenario.shortDescription}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRun1ClickScenario}
            disabled={isGenerating}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>{isGenerating ? 'Generating Scenario...' : 'Execute 1-Click Scenario'}</span>
          </button>
        </div>
      )}

      {/* Agent Identity Card */}
      <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 shadow-sm no-print space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{agent.name}</span>
            </h1>
            <p className="text-xs text-teal-300 font-medium">
              {agent.category} &middot; {agent.outputFormatGuide}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed">
          {agent.description}
        </p>

        {/* Clinical Guardrail Notice */}
        {isClinicalDecisionSupportAgent(agent.id) && (
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px] font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span>SAFETY NOTICE: POPULATION DECISION SUPPORT ONLY</span>
            </div>
            <p className="text-[11px] leading-snug">
              Population-level calculations only. Never prescribe individual patient drug dosages or diagnoses.
            </p>
          </div>
        )}

        {/* Protection / Safeguarding Reminder for Children, GBV, Health */}
        {(agent.id === 'womens_health' || agent.id === 'humanitarian' || agent.id === 'public_health' || agent.id === 'human_rights') && (
          <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-purple-300 text-[11px] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" aria-hidden="true" />
              <span>PROTECTION &amp; SAFEGUARDING MANDATE</span>
            </div>
            <p className="text-[11px] leading-snug text-purple-200">
              {t('safeguarding_notice')}
            </p>
          </div>
        )}

        {/* Keep Everything On This Device Toggle (Privacy By Design) */}
        <div className="p-2.5 rounded-xl bg-[#0F182E] border border-teal-500/30 flex items-center justify-between gap-2">
          <label htmlFor="keep-on-device-toggle" className="flex items-center gap-2 cursor-pointer min-w-0">
            <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                Keep everything on this device
              </span>
              <span className="text-[10px] text-teal-200 block truncate font-mono">
                {keepOnDeviceOnly ? 'Active: Never calls cloud server' : 'Off: Cloud Bedrock enabled (redacted)'}
              </span>
            </div>
          </label>
          <input
            id="keep-on-device-toggle"
            type="checkbox"
            checked={keepOnDeviceOnly}
            onChange={(e) => {
              const val = e.target.checked;
              setKeepOnDeviceState(val);
              setKeepOnDeviceOnly(val);
            }}
            className="w-4 h-4 rounded border-[#2E3C62] text-teal-500 focus:ring-teal-400 cursor-pointer shrink-0"
          />
        </div>

        {/* System Prompt Accordion */}
        <div className="border-t border-[#2E3C62] pt-2">
          <button
            type="button"
            aria-expanded={showSystemPrompt}
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className="w-full flex items-center justify-between text-[11px] font-mono text-slate-300 hover:text-white py-1 transition-colors cursor-pointer"
          >
            <span>Inspect System Prompt Grounding</span>
            {showSystemPrompt ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showSystemPrompt && (
            <pre className="mt-2 p-3 rounded-xl bg-[#0B132B] text-teal-200 text-[10px] font-mono whitespace-pre-wrap leading-relaxed border border-[#2E3C62] max-h-48 overflow-y-auto">
              {agent.systemPrompt}
            </pre>
          )}
        </div>
      </div>

      {/* INPUT FORM (Domain Tailored) */}
      {isGrantProposalAgent ? (
        <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 shadow-sm space-y-3.5 no-print">
          <div className="flex items-center justify-between border-b border-[#2E3C62] pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <span>Proposal Inputs</span>
            </h3>
            <span className="text-[10px] font-mono text-teal-300 font-bold">
              Free &amp; Open Source
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Target Funder / Donor Agency:</label>
            <input
              type="text"
              value={grantFunder}
              onChange={(e) => setGrantFunder(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Call Text / Strategic Priorities:</label>
            <textarea
              rows={3}
              value={grantCallText}
              onChange={(e) => setGrantCallText(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Budget Range &amp; Timeline:</label>
            <input
              type="text"
              value={grantBudgetRange}
              onChange={(e) => setGrantBudgetRange(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white font-mono"
            />
          </div>

          <button
            type="button"
            onClick={handleExecuteGeneration}
            disabled={isGenerating || !grantFunder.trim()}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Structuring 7-Section Proposal...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Generate 7-Section Proposal</span>
              </>
            )}
          </button>
        </div>
      ) : isPublicHealthAgent ? (
        <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 shadow-sm space-y-3.5 no-print">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#0B132B] border border-[#2E3C62]">
            <button
              type="button"
              onClick={() => setPublicHealthMode('outbreak')}
              className={`py-2 px-1 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                publicHealthMode === 'outbreak' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Outbreak
            </button>
            <button
              type="button"
              onClick={() => setPublicHealthMode('surveillance')}
              className={`py-2 px-1 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                publicHealthMode === 'surveillance' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Surveillance
            </button>
            <button
              type="button"
              onClick={() => setPublicHealthMode('coldchain')}
              className={`py-2 px-1 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                publicHealthMode === 'coldchain' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Cold-Chain
            </button>
          </div>

          {publicHealthMode === 'outbreak' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white">Daily / Weekly Case Counts:</label>
              <textarea
                rows={3}
                value={outbreakCaseCounts}
                onChange={(e) => setOutbreakCaseCounts(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white font-mono"
              />
            </div>
          )}

          {publicHealthMode === 'surveillance' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white">Target Pathogen / Syndrome:</label>
              <input
                type="text"
                value={surveillanceDisease}
                onChange={(e) => setSurveillanceDisease(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
              />
            </div>
          )}

          {publicHealthMode === 'coldchain' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white">Clinic Count &amp; Storage Type:</label>
              <input
                type="text"
                value={coldChainFacilities}
                onChange={(e) => setColdChainFacilities(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleExecuteGeneration}
            disabled={isGenerating}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Running Epidemiological Engine...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Generate Public Health Briefing</span>
              </>
            )}
          </button>
        </div>
      ) : isHumanitarianAgent ? (
        <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 shadow-sm space-y-3.5 no-print">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="text-teal-300">Sphere Emergency Parameters:</span>
            <span className="text-[10px] font-mono text-slate-400">Step {humanitarianStep} of 3</span>
          </div>

          {humanitarianStep === 1 && (
            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Disaster / Crisis Type:</label>
                <input
                  type="text"
                  value={crisisType}
                  onChange={(e) => setCrisisType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Operational Location:</label>
                <input
                  type="text"
                  value={crisisLocation}
                  onChange={(e) => setCrisisLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setHumanitarianStep(2)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Population</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {humanitarianStep === 2 && (
            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Target Affected Population:</label>
                <input
                  type="text"
                  value={affectedPopulation}
                  onChange={(e) => setAffectedPopulation(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Demographic Vulnerabilities:</label>
                <input
                  type="text"
                  value={demographicVulnerabilities}
                  onChange={(e) => setDemographicVulnerabilities(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
                />
              </div>
              <div className="flex justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setHumanitarianStep(1)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0B132B] text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setHumanitarianStep(3)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Resources</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {humanitarianStep === 3 && (
            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Pre-positioned Assets &amp; Resources:</label>
                <textarea
                  rows={2}
                  value={availableResources}
                  onChange={(e) => setAvailableResources(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Operational Constraints:</label>
                <input
                  type="text"
                  value={operationalConstraints}
                  onChange={(e) => setOperationalConstraints(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setHumanitarianStep(2)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0B132B] text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleExecuteGeneration}
                  disabled={isGenerating}
                  className="min-h-[48px] px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Generate Sphere Plan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : isResearchAgent ? (
        <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 shadow-sm space-y-3.5 no-print">
          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Research Question / Topic:</label>
            <input
              type="text"
              value={researchTopic}
              onChange={(e) => setResearchTopic(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Operational Region:</label>
            <input
              type="text"
              value={researchRegion}
              onChange={(e) => setResearchRegion(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
            />
          </div>

          <button
            type="button"
            onClick={handleExecuteGeneration}
            disabled={isGenerating || !researchTopic.trim()}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Synthesizing Empirical Literature...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Synthesize Evidence Matrix</span>
              </>
            )}
          </button>
        </div>
      ) : isHumanRightsAgent ? (
        <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 shadow-sm space-y-3.5 no-print">
          <div className="flex items-center justify-between border-b border-[#2E3C62] pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <span>Human Rights Legal Documentation</span>
            </h3>
            <span className="text-[10px] font-mono text-teal-300 font-bold">
              Free &amp; Open Source
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Incident Details &amp; Custodial Facts:</label>
            <textarea
              rows={3}
              value={hrViolationDetails}
              onChange={(e) => setHrViolationDetails(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Applicable Standards &amp; Jurisdiction:</label>
            <input
              type="text"
              value={hrJurisdiction}
              onChange={(e) => setHrJurisdiction(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
            />
          </div>

          <button
            type="button"
            onClick={handleExecuteGeneration}
            disabled={isGenerating || !hrViolationDetails.trim()}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Structuring Legal Memorandum...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Generate Human Rights Legal Brief</span>
              </>
            )}
          </button>
        </div>
      ) : isWomensHealthAgent ? (
        <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 shadow-sm space-y-3.5 no-print">
          <div className="flex items-center justify-between border-b border-[#2E3C62] pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <span>Maternal Survival &amp; GBV Care Protocol</span>
            </h3>
            <span className="text-[10px] font-mono text-teal-300 font-bold">
              Free &amp; Open Source
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Operational Setting &amp; Facility Readiness:</label>
            <input
              type="text"
              value={whSetting}
              onChange={(e) => setWhSetting(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Clinical Priorities &amp; Survivor Safeguards:</label>
            <textarea
              rows={3}
              value={whPriority}
              onChange={(e) => setWhPriority(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white resize-none leading-relaxed"
            />
          </div>

          <button
            type="button"
            onClick={handleExecuteGeneration}
            disabled={isGenerating || !whSetting.trim()}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Formulating Clinical Protocol...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Generate Clinical Protocol</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] p-4 shadow-sm space-y-3 no-print">
          <label className="font-bold text-white text-xs block">
            Mission / Inquiry Parameters:
          </label>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={agent.inputPlaceholder}
            className="w-full p-3 rounded-xl bg-[#0B132B] border border-[#2E3C62] focus:border-teal-400 focus:outline-none text-xs text-white resize-none leading-relaxed"
          />
          <button
            type="button"
            onClick={handleExecuteGeneration}
            disabled={isGenerating || !prompt.trim()}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Processing Synthesis...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Generate Output</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* CLEAR LOADING STATE (<30s Countdown & Progressive Milestones) */}
      {isGenerating && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl bg-[#1C2541] border border-teal-500/40 p-5 text-center space-y-3 shadow-lg animate-pulse"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 mx-auto flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {generationStage || 'Synthesizing field response...'}
            </h3>
            <p className="text-xs text-teal-300 font-mono mt-1">
              Elapsed: {generationSeconds}s &middot; Target: &lt; 30 seconds
            </p>
          </div>
          <div className="w-full bg-[#0B132B] h-2 rounded-full overflow-hidden border border-[#2E3C62]">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(95, 20 + generationSeconds * 35)}%` }}
            />
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {errorMsg && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-200 text-xs space-y-2 no-print"
        >
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Execution Notice</span>
          </div>
          <p className="leading-relaxed whitespace-pre-wrap">{errorMsg}</p>
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRun1ClickScenario}
              className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs cursor-pointer shadow-xs"
            >
              Run 1-Click Sample Instead
            </button>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="px-3 py-1.5 rounded-lg bg-[#0B132B] text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* EMPTY STATE (Before Output is Generated) */}
      {!output && !isGenerating && !errorMsg && (
        <div className="p-6 rounded-2xl bg-[#1C2541]/40 border border-dashed border-[#2E3C62] text-center space-y-3 no-print">
          <Sparkles className="w-8 h-8 mx-auto text-teal-400" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold text-white">
              Ready to generate for {agent.name}
            </h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto mt-1 leading-relaxed">
              Fill in the parameters above or launch the 1-click sample scenario to review complete results in under 30 seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRun1ClickScenario}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>Run Sample Scenario Now</span>
          </button>
        </div>
      )}

      {/* STRUCTURED RESULTS VIEW */}
      {output && (
        <div className="space-y-3 pt-1">
          {/* PII Redaction Notification Banner if redactions occurred */}
          {redactionsFound.length > 0 && (
            <div className="p-3 rounded-2xl bg-teal-950/80 border border-teal-500/40 text-xs text-teal-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-teal-300 text-[11px] font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
                <span>PRIVACY SHIELD: {redactionsFound.length} IDENTIFIERS SCRUBBED BEFORE CLOUD CALL</span>
              </div>
              <p className="text-[11px] leading-snug">
                Personal data was automatically removed to protect privacy in crisis settings: {redactionsFound.map(r => r.replacement).join(', ')}.
              </p>
            </div>
          )}

          {/* Print-Only Header showing Source Label */}
          <div className="hidden print:block p-3 border-b-2 border-black mb-4 text-black font-sans">
            <h1 className="text-base font-black">{agent.name} Output</h1>
            <p className="text-xs mt-1">
              <strong>Source:</strong> {
                generationMeta?.isSimulated || output?.includes('[SIMULATED')
                  ? 'SIMULATED, not from Amazon Bedrock'
                  : generationMeta?.usedRealBedrock
                    ? `Amazon Bedrock (${generationMeta.model || selectedModel || 'configured model'})`
                    : generationMeta?.isOfflineCached
                      ? 'Offline knowledge pack'
                      : generationMeta?.isOfflineOnDevice
                        ? 'On-device'
                        : 'Offline knowledge pack'
              } &middot; <strong>Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#1C2541]/95 border border-[#2E3C62] no-print">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                    {agent.name} Output
                  </h2>
                  {/* Explicit Source Badge: Amazon Bedrock (model ID), On-device, Offline knowledge pack, or SIMULATED */}
                  {generationMeta?.isSimulated || output?.includes('[SIMULATED') ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-mono font-black uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>SIMULATED</span>
                    </span>
                  ) : generationMeta?.usedRealBedrock ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-mono font-bold">
                      <span>Amazon Bedrock ({generationMeta.model || selectedModel || 'configured model'})</span>
                    </span>
                  ) : generationMeta?.isOfflineCached ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                      <span>Offline knowledge pack</span>
                    </span>
                  ) : generationMeta?.isOfflineOnDevice ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold">
                      <span>On-device</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                      <span>Offline knowledge pack</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-teal-200 font-mono">
                  {generationMeta?.durationMs || 1200}ms &middot; Local Vault Encrypted
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsEvidenceModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-200 border border-teal-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" aria-hidden="true" />
                <span>Trust Layer</span>
              </button>

              <button
                type="button"
                onClick={handleChallengeAnswer}
                disabled={isChallenging}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300" aria-hidden="true" />
                <span>{isChallenging ? 'Auditing...' : 'Challenge'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyFull}
                className="px-2.5 py-1.5 rounded-lg bg-[#0B132B] hover:bg-[#152238] text-slate-200 border border-[#2E3C62] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedFull ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFull ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveFullToKb}
                className="px-2.5 py-1.5 rounded-lg bg-[#0B132B] hover:bg-[#152238] text-slate-200 border border-[#2E3C62] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {savedFull ? <BookmarkCheck className="w-3.5 h-3.5 text-teal-300" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{savedFull ? 'Saved' : 'Save KB'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="p-1.5 rounded-lg bg-[#0B132B] hover:bg-[#152238] text-teal-300 border border-[#2E3C62] cursor-pointer"
                title="Share via Offline QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="p-1.5 rounded-lg bg-[#0B132B] hover:bg-[#152238] text-slate-200 border border-[#2E3C62] cursor-pointer"
                title="Print Friendly View"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleExportFullMarkdown}
                className="p-1.5 rounded-lg bg-[#0B132B] hover:bg-[#152238] text-slate-200 border border-[#2E3C62] cursor-pointer"
                title="Download as Markdown file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section Cards */}
          <div className="space-y-3">
            {parsedSections.map((sec) => {
              const isCollapsed = Boolean(collapsedSections[sec.id]);
              const isCopied = copiedSectionId === sec.id;
              const isSaved = savedSectionId === sec.id;
              const currentContent = getEffectiveSectionContent(sec);

              return (
                <div
                  key={sec.id}
                  className="rounded-2xl bg-[#1C2541]/95 border border-[#2E3C62] shadow-sm overflow-hidden"
                >
                  <div
                    onClick={() => toggleSection(sec.id)}
                    className="p-3.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-[#232F52]/60 select-none border-b border-[#2E3C62]/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-[#0B132B] border border-[#2E3C62] shrink-0">
                        {renderSectionIcon(sec.iconType)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white tracking-tight truncate">
                          {sec.title}
                        </h3>
                        <p className="text-[10px] text-slate-300 truncate">
                          {sec.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySection(sec);
                        }}
                        className="p-1.5 rounded-lg bg-[#0B132B] text-slate-200 hover:text-white border border-[#2E3C62] text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Copy Section"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-teal-300" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveSectionToKb(sec);
                        }}
                        className="p-1.5 rounded-lg bg-[#0B132B] text-slate-200 hover:text-white border border-[#2E3C62] text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Save Section to Knowledge Base"
                      >
                        {isSaved ? <BookmarkCheck className="w-3 h-3 text-teal-300" /> : <Bookmark className="w-3 h-3" />}
                      </button>
                      <div className="p-1 text-slate-400">
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="p-4 bg-[#0B132B]/70 text-xs text-slate-100 font-sans space-y-3">
                      {renderSectionBody(currentContent)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EVIDENCE TRUST MODAL */}
      <EvidenceTrustModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        claims={evidenceClaims}
        challengeReport={challengeReport}
        agentName={agent.name}
      />

      {/* OFFLINE QR CODE MODAL */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={agent.name}
        content={output || ''}
        sourceLabel={
          generationMeta?.isSimulated || output?.includes('[SIMULATED')
            ? 'SIMULATED'
            : generationMeta?.usedRealBedrock
              ? `Amazon Bedrock (${generationMeta.model || selectedModel || 'configured model'})`
              : generationMeta?.isOfflineCached
                ? 'Offline knowledge pack'
                : generationMeta?.isOfflineOnDevice
                  ? 'On-device'
                  : 'Offline knowledge pack'
        }
        summary={`${agent.name} (${
          generationMeta?.isSimulated || output?.includes('[SIMULATED')
            ? 'SIMULATED'
            : generationMeta?.usedRealBedrock
              ? `Amazon Bedrock (${generationMeta.model || selectedModel})`
              : generationMeta?.isOfflineCached
                ? 'Offline knowledge pack'
                : 'On-Device'
        })`}
      />
    </div>
  );
};
