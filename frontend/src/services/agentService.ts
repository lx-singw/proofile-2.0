import api from '@/lib/api';

export interface AgentStatus {
    id: string;
    name: string;
    status: 'active' | 'idle' | 'paused' | 'error';
    lastRun?: string;
    stats?: Record<string, number | string>;
}

export interface AgentTask {
    id: string;
    agentId: string;
    action: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
    result?: unknown;
}

const agentService = {
    /**
     * Get status of all agents
     */
    async getAgentStatuses(): Promise<AgentStatus[]> {
        // Mock data for now - replace with real API call
        return [
            { id: 'hunter', name: 'Hunter Agent', status: 'active', lastRun: '2 mins ago', stats: { found: 142, qualified: 38 } },
            { id: 'tailor', name: 'Tailor Agent', status: 'idle', lastRun: '1 hour ago', stats: { tailored: 12, pending: 3 } },
            { id: 'negotiator', name: 'Negotiator Agent', status: 'paused', stats: { insights: 5 } },
        ];
    },

    /**
     * Start/resume an agent
     */
    async startAgent(agentId: string): Promise<AgentStatus> {
        const response = await api.post(`/api/v1/agents/${agentId}/start`);
        return response.data;
    },

    /**
     * Pause an agent
     */
    async pauseAgent(agentId: string): Promise<AgentStatus> {
        const response = await api.post(`/api/v1/agents/${agentId}/pause`);
        return response.data;
    },

    /**
     * Get agent task history
     */
    async getAgentTasks(agentId: string, limit = 50): Promise<AgentTask[]> {
        const response = await api.get(`/api/v1/agents/${agentId}/tasks`, { params: { limit } });
        return response.data;
    },

    /**
     * Update agent configuration
     */
    async updateAgentConfig(agentId: string, config: Record<string, unknown>): Promise<void> {
        await api.put(`/api/v1/agents/${agentId}/config`, config);
    },

    /**
     * Trigger manual agent run
     */
    async triggerAgent(agentId: string): Promise<AgentTask> {
        const response = await api.post(`/api/v1/agents/${agentId}/trigger`);
        return response.data;
    }
};

export default agentService;
