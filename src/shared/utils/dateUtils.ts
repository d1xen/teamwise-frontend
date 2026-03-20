/**
 * Utilitaire pour calculer l'âge depuis une date de naissance
 */
export function calculateAge(birthDate: string | undefined | null): number | null {
  if (!birthDate) return null;

  try {
    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  } catch {
    return null;
  }
}

/**
 * Calculer l'âge moyen d'une liste de membres
 */
export function calculateAverageAge(
  members: Array<{ birthDate?: string | null }>
): number | null {
  const ages = members
    .map(m => calculateAge(m.birthDate))
    .filter((age): age is number => age !== null);

  if (ages.length === 0) return null;

  const sum = ages.reduce((acc, age) => acc + age, 0);
  return Math.round((sum / ages.length) * 10) / 10; // Arrondi à 1 décimale
}

/**
 * Formater une date ISO en format lisible
 */
export function formatDate(isoDate: string | undefined | null, locale = 'fr'): string | null {
  if (!isoDate) return null;

  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

/**
 * Retourne une date ISO (YYYY-MM-DD) à partir d'un DateRange
 */
export function dateRangeToFrom(range: "1m" | "3m" | "6m" | "1y" | "all"): string | null {
    if (range === "all") return null;
    const d = new Date();
    if (range === "1m")  d.setMonth(d.getMonth() - 1);
    if (range === "3m")  d.setMonth(d.getMonth() - 3);
    if (range === "6m")  d.setMonth(d.getMonth() - 6);
    if (range === "1y")  d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
}

/**
 * Formater une date ISO en format court (Jan 2024)
 */
export function formatDateShort(isoDate: string | undefined | null, locale = 'fr'): string | null {
  if (!isoDate) return null;

  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
    });
  } catch {
    return null;
  }
}

