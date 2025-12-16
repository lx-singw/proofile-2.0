/**
 * Moderation Service - Client-side content checks
 * 
 * Provides quick client-side validation before server submission.
 * Server-side moderation is the source of truth.
 */

// Patterns for quick client-side detection
const PROFANITY_PATTERNS = [
    /\b(damn|hell|crap)\b/gi, // Mild - warning only
];

const SEVERE_PATTERNS = [
    /\b(hate|kill|threat|attack)\b/gi,
];

const PII_PATTERNS = {
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
};

const SPAM_PATTERNS = [
    /https?:\/\//gi,
    /click here/gi,
    /(.)\1{5,}/g, // Repeated characters
];

export interface ModerationResult {
    isClean: boolean;
    flags: string[];
    warnings: string[];
    suggestions: string[];
    severity: 'none' | 'low' | 'medium' | 'high';
    cleanedText?: string;
}

/**
 * Check text content for issues before submission
 */
export function moderateText(text: string): ModerationResult {
    const flags: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let cleanedText = text;

    if (!text || text.trim().length === 0) {
        return {
            isClean: true,
            flags: [],
            warnings: [],
            suggestions: [],
            severity: 'none',
        };
    }

    // Check for PII
    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
        if (pattern.test(text)) {
            flags.push(`pii_${type}`);
            suggestions.push(`Consider removing ${type} information for privacy.`);
            // Auto-redact for cleanedText
            cleanedText = cleanedText.replace(pattern, `[${type.toUpperCase()} REMOVED]`);
        }
    }

    // Check for severe content
    if (SEVERE_PATTERNS.some(p => p.test(text))) {
        flags.push('severe_content');
        warnings.push('This content may violate our community guidelines.');
    }

    // Check for profanity (warning only)
    if (PROFANITY_PATTERNS.some(p => p.test(text))) {
        warnings.push('This review contains language that may affect its credibility.');
    }

    // Check for spam patterns
    if (SPAM_PATTERNS.some(p => p.test(text))) {
        flags.push('spam_detected');
        suggestions.push('Avoid including links or promotional content in reviews.');
    }

    // Check for all caps (shouting)
    if (text.length > 20 && text === text.toUpperCase()) {
        warnings.push('Consider using normal capitalization for a more professional tone.');
        cleanedText = text.charAt(0) + text.slice(1).toLowerCase();
    }

    // Determine severity
    let severity: ModerationResult['severity'] = 'none';
    if (flags.includes('severe_content')) {
        severity = 'high';
    } else if (flags.length > 0) {
        severity = 'medium';
    } else if (warnings.length > 0) {
        severity = 'low';
    }

    return {
        isClean: flags.length === 0,
        flags,
        warnings,
        suggestions,
        severity,
        cleanedText: flags.length > 0 ? cleanedText : undefined,
    };
}

/**
 * Check if a rating seems suspicious
 */
export function checkRatingSuspicion(rating: {
    overallScore: number;
    dimensions: Record<string, number>;
    textLength: number;
    timeToComplete: number; // seconds
}): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // All 5s with no text is suspicious
    const allFives = rating.overallScore === 5 &&
        Object.values(rating.dimensions).every(v => v === 5);
    if (allFives && rating.textLength < 20) {
        reasons.push('Perfect scores with minimal feedback may seem less credible.');
    }

    // Completed too fast
    if (rating.timeToComplete < 30) {
        reasons.push('This rating was completed very quickly.');
    }

    // All same scores
    const dimValues = Object.values(rating.dimensions);
    if (dimValues.length > 2 && new Set(dimValues).size === 1) {
        reasons.push('Consider varying dimension scores for more nuanced feedback.');
    }

    return {
        suspicious: reasons.length > 0,
        reasons,
    };
}

/**
 * Request server-side moderation check
 */
export async function requestServerModeration(text: string): Promise<ModerationResult> {
    try {
        const response = await fetch('/api/v1/ratings/moderation/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            // Fall back to client-side
            return moderateText(text);
        }

        return response.json();
    } catch (error) {
        console.error('Server moderation failed, using client-side:', error);
        return moderateText(text);
    }
}

/**
 * Report content for manual review
 */
export async function reportContent(params: {
    contentType: 'review' | 'rating' | 'profile';
    contentId: string;
    reason: string;
    details?: string;
}): Promise<{ success: boolean; ticketId?: string }> {
    try {
        const response = await fetch('/api/v1/ratings/moderation/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            return { success: false };
        }

        const data = await response.json();
        return { success: true, ticketId: data.report_id?.toString() };
    } catch (error) {
        console.error('Failed to report content:', error);
        return { success: false };
    }
}
