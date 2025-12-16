import { create } from 'zustand';

type AgentStatus = 'active' | 'idle' | 'paused' | 'error';

interface Agent {
    id: string;
    name: string;
    status: AgentStatus;
    lastRun?: string;
    message?: string;
}

interface AgentState {
    agents: Agent[];

    // Actions
    setAgents: (agents: Agent[]) => void;
    updateAgentStatus: (id: string, status: AgentStatus, message?: string) => void;
    toggleAgent: (id: string) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
    agents: [
        { id: 'hunter', name: 'Hunter', status: 'active', message: 'Scanning jobs...' },
        { id: 'tailor', name: 'Tailor', status: 'idle', message: 'Ready' },
        { id: 'negotiator', name: 'Negotiator', status: 'paused', message: 'Premium feature' }
    ],

    setAgents: (agents) => set({ agents }),

    updateAgentStatus: (id, status, message) => set((state) => ({
        agents: state.agents.map(agent =>
            agent.id === id ? { ...agent, status, message } : agent
        )
    })),

    toggleAgent: (id) => set((state) => ({
        agents: state.agents.map(agent =>
            agent.id === id
                ? { ...agent, status: agent.status === 'active' ? 'paused' : 'active' }
                : agent
        )
    }))
}));
