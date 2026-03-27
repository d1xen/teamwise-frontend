/**
 * countryUtils.ts
 * Utilitaires pour gérer les nationalités et continents
 * Calcul générique et configurable de la nationalité d'équipe
 */

import { MAJORITY_THRESHOLD } from "@/shared/constants/teamConstants";

// ============================================================================
// Types
// ============================================================================

export interface TeamNationality {
  type: 'country' | 'continent';
  code: string; // ISO 2 letters pour pays (FR, DE, etc.) ou continent code
  displayLabel: string; // Label à afficher (FR, Europe, etc.)
  tooltipLabel: string; // Label du tooltip au survol
  countryCount?: number; // Nombre de joueurs du pays (optionnel)
}

// ============================================================================
// Constants
// ============================================================================

const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // Europe
  'FR': 'EU', 'DE': 'EU', 'GB': 'EU', 'ES': 'EU', 'IT': 'EU',
  'SE': 'EU', 'NO': 'EU', 'DK': 'EU', 'PL': 'EU', 'RU': 'EU',
  'NL': 'EU', 'BE': 'EU', 'CH': 'EU', 'AT': 'EU', 'CZ': 'EU',
  'SK': 'EU', 'HU': 'EU', 'RO': 'EU', 'BG': 'EU', 'HR': 'EU',
  'SI': 'EU', 'PT': 'EU', 'GR': 'EU', 'TR': 'EU', 'UA': 'EU',
  'BY': 'EU', 'LT': 'EU', 'LV': 'EU', 'EE': 'EU', 'IE': 'EU',
  'IS': 'EU', 'MD': 'EU', 'RS': 'EU', 'BA': 'EU', 'ME': 'EU',
  'MK': 'EU', 'AL': 'EU', 'LU': 'EU', 'MT': 'EU', 'CY': 'EU',
  'FI': 'EU',

  // Amérique du Nord
  'US': 'NA', 'CA': 'NA', 'MX': 'NA',

  // Amérique du Sud
  'BR': 'SA', 'AR': 'SA', 'CL': 'SA', 'CO': 'SA', 'PE': 'SA',
  'VE': 'SA', 'EC': 'SA', 'BO': 'SA', 'PY': 'SA', 'UY': 'SA',

  // Asie
  'CN': 'AS', 'JP': 'AS', 'KR': 'AS', 'IN': 'AS', 'TH': 'AS',
  'VN': 'AS', 'MY': 'AS', 'SG': 'AS', 'PH': 'AS', 'ID': 'AS',
  'PK': 'AS', 'BD': 'AS', 'MM': 'AS', 'KH': 'AS', 'LA': 'AS',
  'TW': 'AS', 'HK': 'AS', 'MO': 'AS', 'MN': 'AS', 'KZ': 'AS',
  'UZ': 'AS', 'TJ': 'AS', 'KG': 'AS', 'TM': 'AS', 'AZ': 'AS',
  'AM': 'AS', 'GE': 'AS', 'IL': 'AS', 'SA': 'AS', 'AE': 'AS',
  'QA': 'AS', 'KW': 'AS', 'BH': 'AS', 'OM': 'AS', 'YE': 'AS',
  'JO': 'AS', 'LB': 'AS', 'SY': 'AS', 'IQ': 'AS', 'IR': 'AS',
  'AF': 'AS', 'NP': 'AS', 'BT': 'AS', 'LK': 'AS',

  // Afrique
  'NG': 'AF', 'ZA': 'AF', 'EG': 'AF', 'KE': 'AF', 'ET': 'AF',
  'GH': 'AF', 'TZ': 'AF', 'UG': 'AF', 'MA': 'AF', 'TN': 'AF',
  'DZ': 'AF', 'SD': 'AF', 'SS': 'AF', 'RW': 'AF', 'BW': 'AF',
  'NA': 'AF', 'ZW': 'AF', 'MZ': 'AF', 'MW': 'AF', 'ZM': 'AF',
  'AO': 'AF', 'CM': 'AF', 'GA': 'AF', 'CG': 'AF', 'CD': 'AF',
  'SN': 'AF', 'ML': 'AF', 'CI': 'AF', 'LR': 'AF', 'SL': 'AF',
  'BJ': 'AF', 'BF': 'AF', 'NE': 'AF', 'TD': 'AF', 'CF': 'AF',

  // Océanie
  'AU': 'OC', 'NZ': 'OC', 'FJ': 'OC', 'PG': 'OC', 'SB': 'OC',
  'VU': 'OC', 'WS': 'OC', 'KI': 'OC', 'TO': 'OC', 'PW': 'OC',
  'FM': 'OC', 'MH': 'OC', 'NR': 'OC',
};

// Note: MAJORITY_THRESHOLD est défini dans teamConstants.ts

// ============================================================================
// Functions
// ============================================================================

/**
 * Récupère le continent pour un code pays
 * Retourne undefined si le pays est inconnu
 */
function getContinent(countryCode: string): string | undefined {
  return COUNTRY_TO_CONTINENT[countryCode];
}

/**
 * Compte les joueurs par pays parmi les membres actifs
 * Filtre les joueurs sans countryCode et non-actifs
 */
function countPlayersByCountry(
  members: Array<{ countryCode?: string; activePlayer?: boolean }>
): Record<string, number> {
  const counts: Record<string, number> = {};

  members.forEach((member) => {
    // Ne compter que les joueurs actifs avec un countryCode défini
    if (!member.countryCode) return;
    if (member.activePlayer === false) return; // Exclure les joueurs non-actifs

    counts[member.countryCode] = (counts[member.countryCode] || 0) + 1;
  });

  return counts;
}

/**
 * Compte les joueurs par continent
 */
function countPlayersByContinent(
  members: Array<{ countryCode?: string; activePlayer?: boolean }>
): Record<string, number> {
  const counts: Record<string, number> = {};

  members.forEach((member) => {
    if (!member.countryCode) return;
    if (member.activePlayer === false) return; // Exclure les joueurs non-actifs

    const continent = getContinent(member.countryCode);
    if (!continent) return;

    counts[continent] = (counts[continent] || 0) + 1;
  });

  return counts;
}

/**
 * Récupère la clé avec le compte le plus élevé
 */
function getMaxKey(counts: Record<string, number>): string | null {
  let maxKey: string | null = null;
  let maxCount = 0;

  Object.entries(counts).forEach(([key, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxKey = key;
    }
  });

  return maxKey;
}

/**
 * Calcule la nationalité de l'équipe basée sur la majorité des joueurs
 *
 * Logique :
 * 1. Si 1 seul joueur actif avec countryCode → nationalité = pays du joueur
 * 2. Si ≥ MAJORITY_THRESHOLD joueurs actifs du même pays → nationalité = ce pays
 * 3. Sinon → nationalité = continent de la majorité
 * 4. Si aucun joueur actif avec countryCode → null
 */
export function calculateTeamNationality(
  members: Array<{ countryCode?: string; activePlayer?: boolean }> = []
): TeamNationality | null {
  // Filtrer les joueurs actifs avec countryCode
  const membersWithCountry = members.filter(
    (m) => m.countryCode && m.activePlayer !== false
  );

  if (membersWithCountry.length === 0) {
    return null;
  }

  // Cas 1 : Un seul joueur actif
  if (membersWithCountry.length === 1) {
    const countryCode = membersWithCountry[0].countryCode!;
    return {
      type: 'country',
      code: countryCode,
      displayLabel: countryCode,
      tooltipLabel: countryCode,
      countryCount: 1,
    };
  }

  // Cas 2 & 3 : Multiple joueurs
  const countryCounts = countPlayersByCountry(members);
  const maxCountry = getMaxKey(countryCounts);
  const maxCountryCount = maxCountry ? countryCounts[maxCountry] : 0;

  // Vérifier le seuil de majorité par pays
  if (maxCountryCount >= MAJORITY_THRESHOLD && maxCountry) {
    return {
      type: 'country',
      code: maxCountry,
      displayLabel: maxCountry,
      tooltipLabel: `${maxCountry} (${maxCountryCount} joueurs)`,
      countryCount: maxCountryCount,
    };
  }

  // Sinon, utiliser le continent
  const continentCounts = countPlayersByContinent(members);
  const maxContinent = getMaxKey(continentCounts);

  if (!maxContinent) {
    return null;
  }

  const continentLabel = getContinentLabel(maxContinent);
  const continentCount = continentCounts[maxContinent];

  return {
    type: 'continent',
    code: maxContinent,
    displayLabel: getContinentLabel(maxContinent),
    tooltipLabel: `${continentLabel} (${continentCount} joueurs)`,
  };
}

/**
 * Récupère le label d'affichage pour un code continent
 */
function getContinentLabel(continentCode: string): string {
  const labels: Record<string, string> = {
    'EU': 'Europe',
    'NA': 'North America',
    'SA': 'South America',
    'AS': 'Asia',
    'AF': 'Africa',
    'OC': 'Oceania',
  };
  return labels[continentCode] || continentCode;
}

