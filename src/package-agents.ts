import type { SubagentDefinition } from './types.js';

export interface PackageAgentRegistration {
  source: string;
  agents: SubagentDefinition[];
  onRegistered(dispose: () => void): void;
}

export function installPackageAgentRegistration(pi: any): () => SubagentDefinition[] {
  const packages = new Map<string, SubagentDefinition[]>();
  let unsubscribe: (() => void) | undefined;
  const stop = () => {
    unsubscribe?.();
    unsubscribe = undefined;
    packages.clear();
  };
  pi.on('session_start', () => {
    stop();
    unsubscribe = pi.events.on('subagents:register', (request: PackageAgentRegistration) => {
      if (!request.source.trim()) throw new Error('Package agent source must not be empty');
      const definitions = request.agents.map((agent) => ({ ...agent, name: agent.name.trim().toLowerCase(), scope: 'global' as const }));
      const names = new Set<string>();
      for (const agent of definitions) {
        if (!agent.name || names.has(agent.name)) throw new Error(`Duplicate or empty package agent name: ${agent.name}`);
        names.add(agent.name);
        for (const [owner, registered] of packages) {
          if (owner !== request.source && registered.some((entry) => entry.name === agent.name)) {
            throw new Error(`Package agent "${agent.name}" is already registered by ${owner}`);
          }
        }
      }
      packages.set(request.source, definitions);
      request.onRegistered(() => { if (packages.get(request.source) === definitions) packages.delete(request.source); });
    });
    pi.events.emit('subagents:ready', { version: 1 });
  });
  pi.on('session_shutdown', stop);
  return () => [...packages.values()].flat();
}
