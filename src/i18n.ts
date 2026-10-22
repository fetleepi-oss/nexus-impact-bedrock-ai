/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SupportedLanguage =
  | 'en' // English
  | 'ar' // Arabic (RTL)
  | 'fr' // French
  | 'pt' // Portuguese
  | 'sw' // Swahili
  | 'am' // Amharic
  | 'ti' // Tigrinya
  | 'om' // Oromo
  | 'so' // Somali
  | 'ha' // Hausa
  | 'rw'; // Kinyarwanda

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  isRtl: boolean;
  offlineSupport: 'strong' | 'moderate' | 'weak';
  offlineNotes: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isRtl: false,
    offlineSupport: 'strong',
    offlineNotes: 'High accuracy: comprehensive technical vocabulary and full pretraining coverage for humanitarian standards.'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    isRtl: true,
    offlineSupport: 'weak',
    offlineNotes: 'Notice: Full RTL UI supported; Cloud Bedrock recommended for high-stakes operational synthesis.'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    isRtl: false,
    offlineSupport: 'moderate',
    offlineNotes: 'Moderate accuracy: solid humanitarian French vocabulary; online Bedrock recommended for nuanced donor proposals.'
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    isRtl: false,
    offlineSupport: 'moderate',
    offlineNotes: 'Moderate accuracy: covers emergency WASH and public health terminology; Bedrock recommended for grant writing.'
  },
  sw: {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    isRtl: false,
    offlineSupport: 'weak',
    offlineNotes: 'Notice: On-device tokenizer has limited agglutinative medical coverage. Cloud Bedrock recommended for clinical precision.'
  },
  am: {
    code: 'am',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    isRtl: false,
    offlineSupport: 'weak',
    offlineNotes: 'Notice: On-device model has limited Ge\'ez character coverage. Cloud Bedrock model recommended for official drafts.'
  },
  ti: {
    code: 'ti',
    name: 'Tigrinya',
    nativeName: 'ትግርኛ',
    isRtl: false,
    offlineSupport: 'weak',
    offlineNotes: 'Notice: Highly restricted on-device vocabulary. Please verify outputs locally or sync to Bedrock when online.'
  },
  om: {
    code: 'om',
    name: 'Oromo',
    nativeName: 'Afaan Oromoo',
    isRtl: false,
    offlineSupport: 'weak',
    offlineNotes: 'Notice: Limited on-device syntax coverage. Use on-device mode for basic templates and sync to Bedrock for full review.'
  },
  so: {
    code: 'so',
    name: 'Somali',
    nativeName: 'Soomaaliga',
    isRtl: false,
    offlineSupport: 'weak',
    offlineNotes: 'Notice: Offline model handles simple phrases; Cloud Bedrock recommended for formal community logistics and clinical triage.'
  },
  ha: {
    code: 'ha',
    name: 'Hausa',
    nativeName: 'Harshen Hausa',
    isRtl: false,
    offlineSupport: 'weak',
    offlineNotes: 'Notice: Basic offline support. Cloud Bedrock recommended for cross-border emergency epidemiology.'
  },
  rw: {
    code: 'rw',
    name: 'Kinyarwanda',
    nativeName: 'Ikinyarwanda',
    isRtl: false,
    offlineSupport: 'weak',
    offlineNotes: 'Notice: Limited on-device linguistic depth. Verify local community health plans with certified supervisors.'
  }
};

const STORAGE_KEY = 'nexus_preferred_language_v2';
const PLAIN_LANGUAGE_KEY = 'nexus_plain_language_mode_v1';

/**
 * Detect language from device navigator or fallback to English
 */
export function detectDeviceLanguage(): SupportedLanguage {
  if (typeof window === 'undefined' || !navigator.language) return 'en';
  const raw = navigator.language.toLowerCase();
  if (raw.startsWith('ar')) return 'ar';
  if (raw.startsWith('fr')) return 'fr';
  if (raw.startsWith('pt')) return 'pt';
  if (raw.startsWith('sw')) return 'sw';
  if (raw.startsWith('am')) return 'am';
  if (raw.startsWith('ti')) return 'ti';
  if (raw.startsWith('om')) return 'om';
  if (raw.startsWith('so')) return 'so';
  if (raw.startsWith('ha')) return 'ha';
  if (raw.startsWith('rw')) return 'rw';
  return 'en';
}

export function getActiveLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
    if (saved && SUPPORTED_LANGUAGES[saved]) return saved;
    return detectDeviceLanguage();
  } catch {
    return 'en';
  }
}

export function setActiveLanguage(lang: SupportedLanguage): void {
  if (typeof window === 'undefined') return;
  if (!SUPPORTED_LANGUAGES[lang]) return;
  localStorage.setItem(STORAGE_KEY, lang);

  // Apply RTL to document root if Arabic
  if (document.documentElement) {
    document.documentElement.dir = SUPPORTED_LANGUAGES[lang].isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }

  window.dispatchEvent(new CustomEvent('nexus_language_changed', {
    detail: { language: lang, info: SUPPORTED_LANGUAGES[lang] }
  }));
}

// Plain-language mode
export function isPlainLanguageMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PLAIN_LANGUAGE_KEY) === 'true';
}

export function setPlainLanguageMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAIN_LANGUAGE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('nexus_plain_language_changed', {
    detail: { plainLanguage: enabled }
  }));
}

export function getLanguageWarning(lang: SupportedLanguage, isOffline: boolean): string | null {
  if (!isOffline) return null;
  const info = SUPPORTED_LANGUAGES[lang];
  if (info.offlineSupport === 'weak') {
    return `${info.name} (${info.nativeName}): ${info.offlineNotes}`;
  }
  return null;
}

// Core UI translation dictionaries
export type TranslationKey =
  | 'app_title'
  | 'agents_tab'
  | 'agentsTab'
  | 'workspace_tab'
  | 'workspaceTab'
  | 'alexa_tab'
  | 'alexaTab'
  | 'sphere_tab'
  | 'sphereTab'
  | 'knowledge_tab'
  | 'knowledgeTab'
  | 'aws_tab'
  | 'awsTab'
  | 'eval_tab'
  | 'evalTab'
  | 'online_badge'
  | 'offline_badge'
  | 'demo_mode_badge'
  | 'panic_wipe_btn'
  | 'privacy_policy'
  | 'terms_of_use'
  | 'cookie_policy'
  | 'do_no_harm'
  | 'accessibility'
  | 'responsible_ai'
  | 'safeguarding_notice'
  | 'run_scenario_btn'
  | 'keep_on_device_label'
  | 'challenge_btn';

export const DICTIONARY: Record<SupportedLanguage, Partial<Record<TranslationKey, string>>> = {
  en: {
    app_title: 'Nexus Impact AI',
    agents_tab: 'Agents',
    workspace_tab: 'Workspace',
    alexa_tab: 'Alexa+ MCP',
    sphere_tab: 'Sphere Tools',
    knowledge_tab: 'Evidence Vault',
    aws_tab: 'Architecture',
    eval_tab: 'Evaluation',
    online_badge: 'Online',
    offline_badge: 'On-device (offline)',
    demo_mode_badge: 'All agents unlocked',
    panic_wipe_btn: 'Panic Wipe / Quick Exit',
    privacy_policy: 'Privacy Policy',
    terms_of_use: 'Terms of Use',
    cookie_policy: 'Storage Policy',
    do_no_harm: 'Do No Harm & Data Protection',
    accessibility: 'Accessibility Statement',
    responsible_ai: 'Responsible AI Notice',
    safeguarding_notice: 'Protection Notice: Do not enter identifying victim details or precise safehouse locations.',
    run_scenario_btn: '1-Click Scenario',
    keep_on_device_label: 'Keep everything on this device',
    challenge_btn: 'Challenge This Output'
  },
  ar: {
    app_title: 'نكسس إمباكت للذكاء الاصطناعي',
    agents_tab: 'الوكلاء',
    workspace_tab: 'مساحة العمل',
    alexa_tab: 'أليكسا+ بروتوكول MCP',
    sphere_tab: 'أدوات معايير إسفير',
    knowledge_tab: 'خزينة الأدلة',
    aws_tab: 'البنية الهندسية',
    eval_tab: 'التقييم',
    online_badge: 'متصل',
    offline_badge: 'على الجهاز (دون إنترنت)',
    demo_mode_badge: 'جميع الوكلاء متاحون',
    panic_wipe_btn: 'مسح الطوارئ السريع',
    privacy_policy: 'سياسة الخصوصية',
    terms_of_use: 'شروط الاستخدام',
    cookie_policy: 'سياسة التخزين المحلي',
    do_no_harm: 'عدم الإضرار وحماية البيانات',
    accessibility: 'بيان إمكانية الوصول',
    responsible_ai: 'إشعار الذكاء الاصطناعي المسؤول',
    safeguarding_notice: 'تنبيه الحماية: يمنع إدخال بيانات هوية الضحايا أو إحداثيات المواقع الآمنة.',
    run_scenario_btn: 'سيناريو بنقرة واحدة',
    keep_on_device_label: 'الاحتفاظ بكل البيانات على الجهاز فقط',
    challenge_btn: 'اختبار صحة الإجابة'
  },
  fr: {
    app_title: 'Nexus Impact AI',
    agents_tab: 'Agents',
    workspace_tab: 'Espace de Travail',
    alexa_tab: 'Alexa+ MCP',
    sphere_tab: 'Outils Sphère',
    knowledge_tab: 'Coffre de Preuves',
    aws_tab: 'Architecture',
    eval_tab: 'Évaluation',
    online_badge: 'En ligne',
    offline_badge: 'Sur appareil (hors-ligne)',
    demo_mode_badge: 'Tous les agents débloqués',
    panic_wipe_btn: 'Sortie Rapide / Effacement',
    privacy_policy: 'Politique de Confidentialité',
    terms_of_use: 'Conditions d\'Utilisation',
    cookie_policy: 'Politique de Stockage',
    do_no_harm: 'Ne Pas Nuire & Protection',
    accessibility: 'Accessibilité',
    responsible_ai: 'IA Responsable',
    safeguarding_notice: 'Avis de Sauvegarde: Ne saisissez pas de données identifiant les victimes ni de coordonnées GPS précises.',
    run_scenario_btn: 'Scénario en 1 Clic',
    keep_on_device_label: 'Conserver tout sur cet appareil',
    challenge_btn: 'Contester cette réponse'
  },
  pt: {
    app_title: 'Nexus Impact AI',
    agents_tab: 'Agentes',
    workspace_tab: 'Área de Trabalho',
    alexa_tab: 'Alexa+ MCP',
    sphere_tab: 'Ferramentas Esfera',
    knowledge_tab: 'Cofre de Evidências',
    aws_tab: 'Arquitetura',
    eval_tab: 'Avaliação',
    online_badge: 'Online',
    offline_badge: 'No dispositivo (offline)',
    demo_mode_badge: 'Todos os agentes desbloqueados',
    panic_wipe_btn: 'Saída Rápida / Limpeza de Emergência',
    privacy_policy: 'Política de Privacidade',
    terms_of_use: 'Termos de Uso',
    cookie_policy: 'Política de Armazenamento',
    do_no_harm: 'Não Causar Dano & Proteção',
    accessibility: 'Acessibilidade',
    responsible_ai: 'IA Responsável',
    safeguarding_notice: 'Aviso de Proteção: Nunca insira dados identificáveis de vítimas ou coordenadas confidenciais.',
    run_scenario_btn: 'Cenário em 1 Clique',
    keep_on_device_label: 'Manter tudo neste dispositivo',
    challenge_btn: 'Desafiar esta resposta'
  },
  sw: {
    app_title: 'Nexus Impact AI',
    agents_tab: 'Wakala',
    workspace_tab: 'Kazi',
    alexa_tab: 'Alexa+ MCP',
    sphere_tab: 'Vigezo vya Sphere',
    knowledge_tab: 'Hazina ya Ushahidi',
    aws_tab: 'Muundo',
    eval_tab: 'Tathmini',
    online_badge: 'Mtandao',
    offline_badge: 'Kwenye Kifaa (Nje ya Mtandao)',
    demo_mode_badge: 'Wakala wote wamefunguliwa',
    panic_wipe_btn: 'Futa Data Haraka / Toka Salama',
    privacy_policy: 'Sera ya Faragha',
    terms_of_use: 'Masharti ya Matumizi',
    cookie_policy: 'Sera ya Uhifadhi wa Ndani',
    do_no_harm: 'Usidhuru & Ulinzi wa Data',
    accessibility: 'Ufikivu',
    responsible_ai: 'Taarifa ya AI ya Kuwajibika',
    safeguarding_notice: 'Onyo la Ulinzi: Usiweke majina au nambari za utambulisho wa waathirika.',
    run_scenario_btn: 'Mfano wa Papo Hapo',
    keep_on_device_label: 'Hifadhi kila kitu kwenye kifaa hiki tu',
    challenge_btn: 'Chunguza Majibu Haya'
  },
  am: {
    app_title: 'ኔክሰስ ኢምፓክት AI',
    agents_tab: 'ወኪሎች',
    workspace_tab: 'የስራ ቦታ',
    alexa_tab: 'አሌክሳ+ MCP',
    sphere_tab: 'የስፌር መለኪያዎች',
    knowledge_tab: 'የመረጃ ቋት',
    aws_tab: 'አርክቴክቸር',
    eval_tab: 'ግምገማ',
    online_badge: 'በመስመር ላይ',
    offline_badge: 'በስልኩ ላይ (ከመስመር ውጭ)',
    demo_mode_badge: 'ሁሉም ወኪሎች ተከፍተዋል',
    panic_wipe_btn: 'የአደጋ ጊዜ መረጃ ማጥፊያ',
    privacy_policy: 'የግላዊነት ፖሊሲ',
    terms_of_use: 'የአጠቃቀም ደንቦች',
    cookie_policy: 'የማከማቻ ፖሊሲ',
    do_no_harm: 'አትጉዳ እና የመረጃ ጥበቃ',
    accessibility: 'ተደራሽነት',
    responsible_ai: 'ኃላፊነት የተሞላበት AI',
    safeguarding_notice: 'የጥበቃ ማስታወሻ፡ የግለሰቦችን ወይም ተጎጂዎችን ስም እና ምስጢራዊ መገኛ አያስገቡ።',
    run_scenario_btn: 'በአንድ ጠቅታ ማሳያ',
    keep_on_device_label: 'ሁሉንም ነገር በዚህ ስልክ ላይ ብቻ አስቀምጥ',
    challenge_btn: 'ይህንን መልስ ፈትሽ'
  },
  ti: {
    app_title: 'ኔክሰስ ኢምፓክት AI',
    agents_tab: 'ወከልቲ',
    workspace_tab: 'ስራሕ ባይታ',
    alexa_tab: 'አሌክሳ+ MCP',
    sphere_tab: 'መለክዒታት ስፌር',
    knowledge_tab: 'መዝገብ መርትዖታት',
    aws_tab: 'ቅርጺ',
    eval_tab: 'ገምጋም',
    online_badge: 'ኦንላይን',
    offline_badge: 'ኣብዚ መሳርሒ (ኦፍላይን)',
    demo_mode_badge: 'ኩሎም ወከልቲ ተኸፊቶም',
    panic_wipe_btn: 'ናይ ህጹጽ እዋን መሕበሲ',
    privacy_policy: 'ናይ ብሕትውና ፖሊሲ',
    terms_of_use: 'ውዕል ኣጠቓቕማ',
    cookie_policy: 'ፖሊሲ ምዕቃብ መረዳእታ',
    do_no_harm: 'ኣይትጉዳእ & ሓለዋ መረዳእታ',
    accessibility: 'ተበጻሕነት',
    responsible_ai: 'ሓላፍነታዊ AI',
    safeguarding_notice: 'መተሓሳሰቢ ሓለዋ፡ ስም ግዳያት ወይ ሚስጥራዊ ቦታታት ኣየእትዉ።',
    run_scenario_btn: 'ብሓደ ጠውቂ ኣርእይ',
    keep_on_device_label: 'ኩሉ ኣብዚ መሳርሒ ጥራይ ይጽናሕ',
    challenge_btn: 'ነዚ መልሲ መርምር'
  },
  om: {
    app_title: 'Nexus Impact AI',
    agents_tab: 'Egentoota',
    workspace_tab: 'Iddoo Hojii',
    alexa_tab: 'Alexa+ MCP',
    sphere_tab: 'Meeshaalee Isfeeri',
    knowledge_tab: 'Kuusaa Ragaa',
    aws_tab: 'Jaargooma',
    eval_tab: 'Madaallii',
    online_badge: 'Online',
    offline_badge: 'Meeshaa Irra (Offline)',
    demo_mode_badge: 'Egentootni hundi banamaniiru',
    panic_wipe_btn: 'Haquufi Baqachuu Ariifachiisaa',
    privacy_policy: 'Imaammata Qooda Dhuunfaa',
    terms_of_use: 'Waliigaltee Fayyadamaa',
    cookie_policy: 'Imaammata Kuusaa',
    do_no_harm: 'Miidhaa Geessisuu Dhiisuu',
    accessibility: 'Dhaqqabamummaa',
    responsible_ai: 'AI Itti Gaafatamummaa Qabu',
    safeguarding_notice: 'Akeekkachiisa Eegumsaa: Maqaa miidhamtootaa ykn teessoo iccitii hin galchinaa.',
    run_scenario_btn: 'Fakkeenya Cuqqaallii Tokkoo',
    keep_on_device_label: 'Waan hunda meeshaa kana irratti qofa tursiisi',
    challenge_btn: 'Deebii kana qoradhu'
  },
  so: {
    app_title: 'Nexus Impact AI',
    agents_tab: 'Wakiillada',
    workspace_tab: 'Goobta Shaqada',
    alexa_tab: 'Alexa+ MCP',
    sphere_tab: 'Halbeegyada Sphere',
    knowledge_tab: 'Kaydka Caddaymaha',
    aws_tab: 'Dhismaha',
    eval_tab: 'Qiimaynta',
    online_badge: 'Online',
    offline_badge: 'Aaladda Dhexdeeda (Offline)',
    demo_mode_badge: 'Dhammaan wakiillada waa furan yihiin',
    panic_wipe_btn: 'Tir Degdeg ah / Ka Bax',
    privacy_policy: 'Xeerka Arrimaha Gaarka ah',
    terms_of_use: 'Shuruudaha Adeegsiga',
    cookie_policy: 'Xeerka Kaydinta Xogta',
    do_no_harm: 'Ha Waxyeelayn & Ilaalinta Xogta',
    accessibility: 'Helitaanka',
    responsible_ai: 'AI Masuuliyad Leh',
    safeguarding_notice: 'Digniin Ilaalin: Ha gelin macluumaadka dadka dhibaataysan ama goobaha qarsoodiga ah.',
    run_scenario_btn: 'Tusaale Hal-Guji Ah',
    keep_on_device_label: 'Wax walba ku hay aaladdan oo keliya',
    challenge_btn: 'Dood geli jawaabtan'
  },
  ha: {
    app_title: 'Nexus Impact AI',
    agents_tab: 'Masuula',
    workspace_tab: 'Wurin Aiki',
    alexa_tab: 'Alexa+ MCP',
    sphere_tab: 'Ka\'idojin Sphere',
    knowledge_tab: 'Rumbun Shaidu',
    aws_tab: 'Tsari',
    eval_tab: 'Kima',
    online_badge: 'Online',
    offline_badge: 'Cikin Na\'ura (Ba Intanet)',
    demo_mode_badge: 'Duk masuula a bude suke',
    panic_wipe_btn: 'Goge Komai Da Sauri / Fita',
    privacy_policy: 'Ka\'idar Tsare Sirri',
    terms_of_use: 'Sharuddan Amfani',
    cookie_policy: 'Ka\'idar Ajiye Bayanai',
    do_no_harm: 'Kada Ka Cutar Da Kariya',
    accessibility: 'Saukin Amfani',
    responsible_ai: 'AI Mai Hakki',
    safeguarding_notice: 'Sanarwar Kariya: Kada a saka bayanan wadanda abin ya shafa ko wurare masu hadari.',
    run_scenario_btn: 'Misali Da Dannawa Daya',
    keep_on_device_label: 'Ajiye komai a cikin wannan na\'urar kawai',
    challenge_btn: 'Kalubalanci wannan amsar'
  },
  rw: {
    app_title: 'Nexus Impact AI',
    agents_tab: 'Abafasha',
    workspace_tab: 'Aho Gukorera',
    alexa_tab: 'Alexa+ MCP',
    sphere_tab: 'Ibipimo bya Sphere',
    knowledge_tab: 'Ububiko bw\'Ibimenyetso',
    aws_tab: 'Imiterere',
    eval_tab: 'Isuzuma',
    online_badge: 'Kuri interineti',
    offline_badge: 'Kuri Telefoni (Offline)',
    demo_mode_badge: 'Abafasha bose barafunguye',
    panic_wipe_btn: 'Gusiba Byose Byihuse / Gusohoka',
    privacy_policy: 'Politiki y\'Ubuzima Bwite',
    terms_of_use: 'Amabwiriza yo Gukoresha',
    cookie_policy: 'Politiki yo Kubika Amakuru',
    do_no_harm: 'Kutangiza no Kurinda Amakuru',
    accessibility: 'Uburyo bwo Kugera ku Bisubizo',
    responsible_ai: 'Ubwenge bwa AI Bukorana Ubushishozi',
    safeguarding_notice: 'Icyitonderwa cyo Kurinda: Ntushyiremo imyirondoro y\'abakorewe ihohoterwa cyangwa aho bihishe.',
    run_scenario_btn: 'Urugero rwo Kanda Rimwe',
    keep_on_device_label: 'Bika byose kuri iyi telefoni gusa',
    challenge_btn: 'Genzura iki gisubizo'
  }
};

export function translate(key: TranslationKey | string, langOverride?: SupportedLanguage): string {
  const lang = langOverride || getActiveLanguage();
  // Map camelCase tab aliases to snake_case dictionary keys
  const mappedKey = (
    key === 'agentsTab' ? 'agents_tab' :
    key === 'workspaceTab' ? 'workspace_tab' :
    key === 'alexaTab' ? 'alexa_tab' :
    key === 'sphereTab' ? 'sphere_tab' :
    key === 'knowledgeTab' ? 'knowledge_tab' :
    key === 'awsTab' ? 'aws_tab' :
    key === 'evalTab' ? 'eval_tab' :
    key
  ) as TranslationKey;

  return DICTIONARY[lang]?.[mappedKey] || DICTIONARY.en[mappedKey] || String(key);
}

export function t(key: TranslationKey | string): string {
  return translate(key);
}

