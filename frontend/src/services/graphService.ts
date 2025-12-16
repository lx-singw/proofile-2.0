/**
 * Graph Service - Network visualization data
 * 
 * Prepares data for 3D constellation view (Three.js/React-Force-Graph)
 * Currently provides 2D data structures; upgrade to 3D when visualization is built.
 */

export interface GraphNode {
    id: string;
    label: string;
    type: 'user' | 'manager' | 'peer' | 'you';
    score?: number;
    verified?: boolean;
    size?: number;
}

export interface GraphEdge {
    source: string;
    target: string;
    weight: number;
    type: 'manager_rating' | 'peer_rating' | 'staked';
    bidirectional?: boolean;
}

export interface ReputationGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    gravity: number; // 0-100 "social gravity" score
    connections: number;
}

/**
 * Fetch reputation graph for a user
 */
export async function getReputationGraph(userId?: number): Promise<ReputationGraph> {
    const endpoint = userId
        ? `/api/v1/ratings/graph/${userId}`
        : '/api/v1/ratings/graph/me';

    try {
        const response = await fetch(endpoint, {
            credentials: 'include',
        });

        if (!response.ok) {
            // Return mock data for now if endpoint not ready
            return getMockGraph();
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching reputation graph:', error);
        return getMockGraph();
    }
}

/**
 * Find connections between two users (Trust Path)
 */
export async function findTrustPath(
    fromUserId: number,
    toUserId: number
): Promise<{
    path: GraphNode[];
    hops: number;
    trustScore: number;
}> {
    try {
        const response = await fetch(
            `/api/v1/ratings/graph/path?from=${fromUserId}&to=${toUserId}`,
            { credentials: 'include' }
        );

        if (!response.ok) {
            return { path: [], hops: -1, trustScore: 0 };
        }

        return response.json();
    } catch (error) {
        console.error('Error finding trust path:', error);
        return { path: [], hops: -1, trustScore: 0 };
    }
}

/**
 * Get "warm intro" suggestions - people trusted by your connections
 */
export async function getWarmIntros(targetRole?: string): Promise<GraphNode[]> {
    const params = targetRole ? `?role=${encodeURIComponent(targetRole)}` : '';

    try {
        const response = await fetch(`/api/v1/ratings/graph/warm-intros${params}`, {
            credentials: 'include',
        });

        if (!response.ok) {
            return [];
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching warm intros:', error);
        return [];
    }
}

/**
 * Calculate "Squad Fit" for a candidate
 */
export async function calculateSquadFit(
    candidateId: number,
    teamMemberIds: number[]
): Promise<{
    chemistryScore: number;
    reasons: string[];
    skillGaps: string[];
    synergies: string[];
}> {
    try {
        const response = await fetch('/api/v1/ratings/graph/squad-fit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                candidate_id: candidateId,
                team_member_ids: teamMemberIds,
            }),
        });

        if (!response.ok) {
            return { chemistryScore: 0, reasons: [], skillGaps: [], synergies: [] };
        }

        return response.json();
    } catch (error) {
        console.error('Error calculating squad fit:', error);
        return { chemistryScore: 0, reasons: [], skillGaps: [], synergies: [] };
    }
}

// Mock data for development
function getMockGraph(): ReputationGraph {
    return {
        nodes: [
            { id: 'you', label: 'You', type: 'you', score: 4.8, verified: true, size: 20 },
            { id: 'm1', label: 'Sarah (Manager)', type: 'manager', score: 5.0, verified: true, size: 15 },
            { id: 'p1', label: 'Mike (Peer)', type: 'peer', score: 4.5, verified: true, size: 12 },
            { id: 'p2', label: 'Alex (Peer)', type: 'peer', score: 4.2, verified: false, size: 10 },
        ],
        edges: [
            { source: 'm1', target: 'you', weight: 1.5, type: 'manager_rating' },
            { source: 'p1', target: 'you', weight: 1.0, type: 'peer_rating', bidirectional: true },
            { source: 'p2', target: 'you', weight: 0.3, type: 'peer_rating' },
        ],
        gravity: 85,
        connections: 12,
    };
}
