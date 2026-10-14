/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KnowledgeMetric {
  label: string;
  value: string;
  unit?: string;
}

export interface KnowledgeItem {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  prompt: string;
  content: string;
  timestamp: string;
  tags: string[];
  itemType?: 'agent_output' | 'note' | 'metric';
  metrics?: KnowledgeMetric[];
}

const STORAGE_KEY_KB = 'nexus_knowledge_base_v1';

export function getKnowledgeItems(): KnowledgeItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KB);
    if (!raw) {
      const seedItems: KnowledgeItem[] = [
        {
          id: 'kb_seed_1',
          agentId: 'research',
          agentName: 'Research Evidence Synthesis',
          itemType: 'agent_output',
          title: 'Community Health Worker Retention in Post-Conflict Fragile Zones',
          prompt: 'Synthesize evidence on community health worker retention strategies in post-conflict fragile zones.',
          content: `### Executive Evidence Synthesis: Community Health Worker Retention in Fragile Settings

**1. Core Consensus & Key Findings**
* Multi-country randomized evaluations in Eastern Africa and the Sahel confirm that predictable quarterly stipends combined with monthly peer supervision reduce health worker attrition by 41%.
* Mid-upper arm circumference (MUAC) malnutrition triage administered by local CHWs achieved 91% concordance with clinical staff.

**2. Critical Field Constraints**
* 68% of documented program dropouts were attributed to last-mile diagnostic stockouts rather than lack of technical capability.
* Digital offline-first verification eliminated reporting lags and preserved worker motivation.

**3. Strategic Recommendations**
* Pre-position 90-day buffer stocks at district health offices before expanding CHW catchment quotas.`,
          timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
          tags: ['Health', 'CHW', 'FragileStates', 'Evidence'],
          metrics: [
            { label: 'Attrition Reduction', value: '41%' },
            { label: 'MUAC Concordance', value: '91%' },
            { label: 'Buffer Stock SOP', value: '90 Days' }
          ]
        },
        {
          id: 'kb_seed_2',
          agentId: 'humanitarian',
          agentName: 'Humanitarian Emergency Response',
          itemType: 'agent_output',
          title: 'Flood-Displaced Pastoralist Rapid Response Plan (60 Days)',
          prompt: 'Rapid response plan for 4,500 flood-displaced households in low-lying riverine districts over the next 60 days.',
          content: `### Operational Humanitarian Response Plan: Flood Displacement

**1. Crisis Context & Rapid Needs Summary**
* 4,500 flood-displaced households (approx. 27,000 individuals) relocated to elevated riverine embankment sites.
* Immediate priority: Sphere-standard clean water delivery (15 L/person/day) and acute diarrheal disease prevention.

**2. 72-Hour Rapid Stabilization Phase**
* Emergency bladder tanks and mobile water purification units deployed to 3 cluster centroids.
* Distribution of 4,500 shelter kits (reinforced tarpaulins, plastic sheeting, and high-thermal blankets).

**3. Cluster Coordination Framework**
* WASH Cluster: Coordination with district engineers for water testing and chlorine distribution.
* Nutrition Cluster: Blanket supplementary feeding for children under 5 and pregnant mothers.`,
          timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
          tags: ['Floods', 'WASH', 'Emergency', 'SphereStandards'],
          metrics: [
            { label: 'Target Population', value: '27,000', unit: 'individuals' },
            { label: 'Sphere Water Target', value: '15', unit: 'L/person/day' },
            { label: 'Emergency Shelter Kits', value: '4,500', unit: 'kits' }
          ]
        },
        {
          id: 'kb_seed_3',
          agentId: 'public_health',
          agentName: 'Public Health Intelligence',
          itemType: 'metric',
          title: 'Epidemiological Cold-Chain Audit: District 4 Health Facilities',
          prompt: 'Cold-chain audit checklist and vaccine holdover metrics across 14 rural health posts.',
          content: `### Field Metric Registry: Solar Direct-Drive Refrigeration Performance

* **Operational Status:** 12 of 14 health posts maintaining strict +2°C to +8°C temperature parameters.
* **Average Autonomy / Holdover:** 74.2 hours holdover without solar irradiation during monsoon heavy cloud cover.
* **Transit Vulnerability:** 2 health posts on eastern unpaved route exceed 4-hour transit threshold during flash floods.
* **Antigen Inventory:** 3,200 doses Measles-Rubella, 1,800 doses Pentavalent secured.`,
          timestamp: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
          tags: ['ColdChain', 'Vaccines', 'PublicHealth', 'Metrics'],
          metrics: [
            { label: 'Temp Range', value: '+2°C to +8°C' },
            { label: 'Holdover Autonomy', value: '74.2', unit: 'hours' },
            { label: 'Operational Uptime', value: '85.7%' }
          ]
        },
        {
          id: 'kb_seed_4',
          agentId: 'custom_note',
          agentName: 'Field Notes & Observations',
          itemType: 'note',
          title: 'District Coordination Meeting: Pre-positioning Agreements',
          prompt: 'Inter-agency memo on local warehouse sharing and fuel rationing agreements.',
          content: `### Inter-Agency Coordination Note (Bi-Weekly Cluster Sync)

* **Agreement Signed:** Local Disaster Management Authority approved joint utilization of the 800m² regional warehouse in Sector 3.
* **Fuel Allocation:** 2,000 liters of emergency diesel ring-fenced for generator backup and water trucking pumps.
* **Community Feedback:** Elders requested relocation of water distribution point 200m closer to safe lighting to safeguard evening collection by women and adolescent girls.`,
          timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
          tags: ['Coordination', 'Logistics', 'Protection', 'Notes'],
          metrics: [
            { label: 'Warehouse Space', value: '800', unit: 'm²' },
            { label: 'Emergency Fuel Buffer', value: '2,000', unit: 'liters' }
          ]
        }
      ];
      localStorage.setItem(STORAGE_KEY_KB, JSON.stringify(seedItems));
      return seedItems;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read knowledge base from localStorage:', err);
    return [];
  }
}

export function saveKnowledgeItem(
  item: Omit<KnowledgeItem, 'id' | 'timestamp'>
): KnowledgeItem {
  const current = getKnowledgeItems();
  const newItem: KnowledgeItem = {
    ...item,
    id: `kb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    itemType: item.itemType || (item.agentId === 'custom_note' ? 'note' : 'agent_output')
  };
  const updated = [newItem, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_KB, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nexus_kb_updated', { detail: updated }));
  } catch (err) {
    console.error('Failed to save item to knowledge base:', err);
  }
  return newItem;
}

export function updateKnowledgeItem(
  id: string,
  updates: Partial<KnowledgeItem>
): KnowledgeItem | null {
  const current = getKnowledgeItems();
  const index = current.findIndex(it => it.id === id);
  if (index === -1) return null;
  const updatedItem = { ...current[index], ...updates };
  current[index] = updatedItem;
  try {
    localStorage.setItem(STORAGE_KEY_KB, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('nexus_kb_updated', { detail: current }));
  } catch (err) {
    console.error('Failed to update item in knowledge base:', err);
  }
  return updatedItem;
}

export function deleteKnowledgeItem(id: string): void {
  const current = getKnowledgeItems();
  const filtered = current.filter(item => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_KB, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('nexus_kb_updated', { detail: filtered }));
  } catch (err) {
    console.error('Failed to delete item from knowledge base:', err);
  }
}

export function exportMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportAllKnowledgeItems(items: KnowledgeItem[]): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const combined = items
    .map((it, idx) => {
      const metricsText = it.metrics && it.metrics.length > 0
        ? `\n**Key Metrics:**\n${it.metrics.map(m => `* ${m.label}: ${m.value}${m.unit ? ` ${m.unit}` : ''}`).join('\n')}\n`
        : '';
      const tagsText = it.tags && it.tags.length > 0 ? `\n*Tags: ${it.tags.map(t => `#${t}`).join(' ')}*\n` : '';
      return `# ${idx + 1}. ${it.title}
*Source: ${it.agentName} | Saved: ${new Date(it.timestamp).toLocaleDateString()} | Type: ${it.itemType || 'Agent Output'}*
${tagsText}
${it.prompt ? `\n**Original Inquiry / Context:**\n> ${it.prompt}\n` : ''}
${metricsText}
**Content & Synthesis:**
${it.content}

--------------------------------------------------
`;
    })
    .join('\n');
  exportMarkdownFile(`nexus_knowledge_base_export_${dateStr}.md`, combined);
}
