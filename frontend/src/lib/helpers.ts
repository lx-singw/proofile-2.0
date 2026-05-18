/**
 * Helper Utilities
 * Common formatting and parsing functions
 */

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return 'Recently';
  const now = new Date();
  const posted = new Date(date);
  const diffMs = now.getTime() - posted.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return posted.toLocaleDateString();
}

export function formatLocation(loc: any): string {
  if (!loc) return 'Nationwide';
  if (typeof loc === 'object') {
    return [loc.city, loc.province].filter(Boolean).join(', ') || 'Nationwide';
  }
  return loc;
}

export function parseRequirements(reqs: any): string[] {
  if (Array.isArray(reqs)) return reqs;
  if (typeof reqs === 'string') {
    try {
      return JSON.parse(reqs);
    } catch (e) {
      return reqs.split('\n').filter(Boolean);
    }
  }
  return [];
}

export function getDaysRemaining(closingDate: string | Date | null | undefined): number | null {
  if (!closingDate) return null;
  const today = new Date();
  const deadline = new Date(closingDate);
  const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function formatYearsExperience(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  if (min === max) return `${min} ${min === 1 ? 'year' : 'years'}`;
  if (max) return `${min}-${max} years`;
  return `${min}+ years`;
}
