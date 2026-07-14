import { VenueNode, VenueEdge, VenueGraph, PathResult } from './types';

// Concrete simulated stadium graph for a World Cup venue
export const stadiumGraph: VenueGraph = {
  nodes: [
    // Outer Gates (A-F)
    { id: 'gate_a', name: 'Gate A (West Main)', type: 'gate', x: 10, y: 50, step_free: true },
    { id: 'gate_b', name: 'Gate B (North West)', type: 'gate', x: 25, y: 15, step_free: true },
    { id: 'gate_c', name: 'Gate C (North East)', type: 'gate', x: 75, y: 15, step_free: true },
    { id: 'gate_d', name: 'Gate D (East Main)', type: 'gate', x: 90, y: 50, step_free: true },
    { id: 'gate_e', name: 'Gate E (South East)', type: 'gate', x: 75, y: 85, step_free: true },
    { id: 'gate_f', name: 'Gate F (South West)', type: 'gate', x: 25, y: 85, step_free: true },

    // Exits
    { id: 'exit_north', name: 'North Express Exit', type: 'exit', x: 50, y: 5, step_free: true },
    { id: 'exit_south', name: 'South Terminal Exit', type: 'exit', x: 50, y: 95, step_free: true },
    { id: 'exit_east', name: 'East Metro Station Link', type: 'exit', x: 95, y: 40, step_free: true },

    // Seating Blocks
    { id: 'block_101', name: 'Seating Block 101 (West Lower)', type: 'seating', x: 32, y: 50, step_free: false }, // stairs required
    { id: 'block_102', name: 'Seating Block 102 (North West)', type: 'seating', x: 38, y: 35, step_free: true },
    { id: 'block_103', name: 'Seating Block 103 (North Front)', type: 'seating', x: 50, y: 32, step_free: true },
    { id: 'block_104', name: 'Seating Block 104 (North East)', type: 'seating', x: 62, y: 35, step_free: false }, // stairs required
    { id: 'block_105', name: 'Seating Block 105 (East Lower)', type: 'seating', x: 68, y: 50, step_free: true },
    { id: 'block_106', name: 'Seating Block 106 (South East)', type: 'seating', x: 62, y: 65, step_free: true },
    { id: 'block_107', name: 'Seating Block 107 (South Front)', type: 'seating', x: 50, y: 68, step_free: false }, // stairs required
    { id: 'block_108', name: 'Seating Block 108 (South West)', type: 'seating', x: 38, y: 65, step_free: true },
    { id: 'block_109', name: 'VIP Lounge West', type: 'seating', x: 28, y: 45, step_free: true },
    { id: 'block_110', name: 'VIP Lounge East', type: 'seating', x: 72, y: 45, step_free: true },

    // Restrooms
    { id: 'restroom_nw', name: 'Restroom Block (North-West)', type: 'restroom', x: 30, y: 25, step_free: true },
    { id: 'restroom_ne', name: 'Restroom Block (North-East)', type: 'restroom', x: 70, y: 25, step_free: true },
    { id: 'restroom_se', name: 'Restroom Block (South-East)', type: 'restroom', x: 70, y: 75, step_free: false }, // some steps
    { id: 'restroom_sw', name: 'Accessible Restroom (South-West)', type: 'restroom', x: 30, y: 75, step_free: true },

    // Concessions
    { id: 'concession_tacos', name: 'Championship Tacos', type: 'concession', x: 20, y: 50, step_free: true },
    { id: 'concession_burgers', name: 'Goalpost Burgers', type: 'concession', x: 50, y: 15, step_free: true },
    { id: 'concession_beer', name: 'Pitchside Beer & Brews', type: 'concession', x: 80, y: 50, step_free: true },
    { id: 'concession_snacks', name: 'Corner Kick Cafe & Snacks', type: 'concession', x: 50, y: 80, step_free: true },

    // Medical Points
    { id: 'med_west', name: 'First Aid Point - West', type: 'medical', x: 18, y: 35, step_free: true },
    { id: 'med_east', name: 'First Aid Point - East', type: 'medical', x: 82, y: 65, step_free: true },

    // Guest Services
    { id: 'guest_info', name: 'Main Information & Help Desk', type: 'guest_services', x: 22, y: 58, step_free: true },
    { id: 'lost_found', name: 'Lost & Found Center', type: 'guest_services', x: 78, y: 58, step_free: true },
  ],
  edges: [
    // Outer Ring Connections
    { from: 'gate_a', to: 'concession_tacos', walk_seconds: 30 },
    { from: 'gate_a', to: 'med_west', walk_seconds: 45 },
    { from: 'gate_a', to: 'guest_info', walk_seconds: 30 },
    { from: 'gate_a', to: 'gate_f', walk_seconds: 120 },
    { from: 'gate_a', to: 'gate_b', walk_seconds: 120 },

    { from: 'gate_b', to: 'restroom_nw', walk_seconds: 40 },
    { from: 'gate_b', to: 'concession_burgers', walk_seconds: 90 },
    { from: 'gate_b', to: 'exit_north', walk_seconds: 100 },
    { from: 'gate_b', to: 'med_west', walk_seconds: 80 },

    { from: 'gate_c', to: 'restroom_ne', walk_seconds: 40 },
    { from: 'gate_c', to: 'concession_burgers', walk_seconds: 90 },
    { from: 'gate_c', to: 'exit_north', walk_seconds: 100 },
    { from: 'gate_c', to: 'gate_d', walk_seconds: 120 },

    { from: 'gate_d', to: 'concession_beer', walk_seconds: 30 },
    { from: 'gate_d', to: 'lost_found', walk_seconds: 30 },
    { from: 'gate_d', to: 'med_east', walk_seconds: 45 },
    { from: 'gate_d', to: 'exit_east', walk_seconds: 40 },
    { from: 'gate_d', to: 'gate_e', walk_seconds: 120 },

    { from: 'gate_e', to: 'restroom_se', walk_seconds: 40 },
    { from: 'gate_e', to: 'concession_snacks', walk_seconds: 90 },
    { from: 'gate_e', to: 'exit_south', walk_seconds: 100 },
    { from: 'gate_e', to: 'med_east', walk_seconds: 80 },

    { from: 'gate_f', to: 'restroom_sw', walk_seconds: 40 },
    { from: 'gate_f', to: 'concession_snacks', walk_seconds: 90 },
    { from: 'gate_f', to: 'exit_south', walk_seconds: 100 },
    { from: 'gate_f', to: 'guest_info', walk_seconds: 90 },

    // Middle Ring / Concessions / Services to Seating Blocks
    { from: 'concession_tacos', to: 'block_101', walk_seconds: 45 },
    { from: 'concession_tacos', to: 'block_109', walk_seconds: 25 },
    { from: 'block_109', to: 'block_101', walk_seconds: 30 },
    { from: 'block_109', to: 'block_102', walk_seconds: 50 },

    { from: 'restroom_nw', to: 'block_102', walk_seconds: 35 },
    { from: 'restroom_nw', to: 'concession_burgers', walk_seconds: 65 },
    { from: 'concession_burgers', to: 'block_103', walk_seconds: 45 },

    { from: 'restroom_ne', to: 'block_104', walk_seconds: 35 },
    { from: 'restroom_ne', to: 'concession_burgers', walk_seconds: 65 },
    { from: 'block_104', to: 'block_103', walk_seconds: 60 },
    { from: 'block_104', to: 'block_110', walk_seconds: 50 },

    { from: 'block_110', to: 'block_105', walk_seconds: 30 },
    { from: 'concession_beer', to: 'block_105', walk_seconds: 45 },
    { from: 'concession_beer', to: 'block_110', walk_seconds: 25 },
    { from: 'lost_found', to: 'block_105', walk_seconds: 45 },
    { from: 'lost_found', to: 'block_106', walk_seconds: 55 },

    { from: 'restroom_se', to: 'block_106', walk_seconds: 35 },
    { from: 'restroom_se', to: 'concession_snacks', walk_seconds: 65 },
    { from: 'concession_snacks', to: 'block_107', walk_seconds: 45 },

    { from: 'restroom_sw', to: 'block_108', walk_seconds: 35 },
    { from: 'restroom_sw', to: 'concession_snacks', walk_seconds: 65 },
    { from: 'block_108', to: 'block_101', walk_seconds: 60 },
    { from: 'block_108', to: 'block_107', walk_seconds: 60 },

    // Intersessional inner links (Seating ring connections)
    { from: 'block_101', to: 'block_102', walk_seconds: 60 },
    { from: 'block_101', to: 'block_108', walk_seconds: 60 },
    { from: 'block_105', to: 'block_104', walk_seconds: 60 },
    { from: 'block_105', to: 'block_106', walk_seconds: 60 },
    { from: 'block_102', to: 'block_103', walk_seconds: 60 },
    { from: 'block_106', to: 'block_107', walk_seconds: 60 },
  ],
};

/**
 * Dijkstra shortest-path function
 * @param origin Start node ID
 * @param destination End node ID
 * @param step_free_only Filter for step-free only paths
 */
export function getNodeZone(nodeId: string): "north" | "south" | "east" | "west" {
  const id = nodeId.toLowerCase();
  if (
    id.includes('north') ||
    id.includes('nw') ||
    id.includes('ne') ||
    id.includes('burgers') ||
    id.includes('102') ||
    id.includes('103') ||
    id.includes('104') ||
    id.includes('exit_north')
  ) {
    return 'north';
  }
  if (
    id.includes('south') ||
    id.includes('sw') ||
    id.includes('se') ||
    id.includes('snacks') ||
    id.includes('106') ||
    id.includes('107') ||
    id.includes('108') ||
    id.includes('exit_south')
  ) {
    return 'south';
  }
  if (
    id.includes('east') ||
    id.includes('beer') ||
    id.includes('105') ||
    id.includes('110') ||
    id.includes('med_east') ||
    id.includes('lost_found') ||
    id.includes('exit_east')
  ) {
    return 'east';
  }
  return 'west';
}

function calculateDijkstra(
  origin: string,
  destination: string,
  step_free_only: boolean,
  crowdStatus?: Record<string, "low" | "medium" | "high">
): PathResult | null {
  const { nodes, edges } = stadiumGraph;
  const nodesMap = new Map(nodes.map((n) => [n.id, n]));
  const originNode = nodesMap.get(origin);
  const destNode = nodesMap.get(destination);

  if (!originNode || !destNode) return null;

  const isNodeAllowed = (nodeId: string): boolean => {
    if (!step_free_only) return true;
    const node = nodesMap.get(nodeId);
    if (!node) return false;
    if (nodeId === origin || nodeId === destination) return true;
    return node.step_free;
  };

  const adj = new Map<string, { to: string; walk_seconds: number }[]>();
  for (const node of nodes) {
    if (isNodeAllowed(node.id)) {
      adj.set(node.id, []);
    }
  }

  for (const edge of edges) {
    if (isNodeAllowed(edge.from) && isNodeAllowed(edge.to)) {
      const listFrom = adj.get(edge.from) || [];
      listFrom.push({ to: edge.to, walk_seconds: edge.walk_seconds });
      adj.set(edge.from, listFrom);

      const listTo = adj.get(edge.to) || [];
      listTo.push({ to: edge.from, walk_seconds: edge.walk_seconds });
      adj.set(edge.to, listTo);
    }
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  for (const nodeId of adj.keys()) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
    unvisited.add(nodeId);
  }

  if (!distances.has(origin)) {
    return null;
  }

  distances.set(origin, 0);

  while (unvisited.size > 0) {
    let minNode: string | null = null;
    let minDist = Infinity;

    for (const nodeId of unvisited) {
      const d = distances.get(nodeId) ?? Infinity;
      if (d < minDist) {
        minDist = d;
        minNode = nodeId;
      }
    }

    if (minNode === null || minNode === destination || minDist === Infinity) {
      break;
    }

    unvisited.delete(minNode);

    const neighbors = adj.get(minNode) || [];
    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor.to)) continue;

      let penalty = 0;
      if (crowdStatus) {
        const zoneFrom = getNodeZone(minNode);
        const zoneTo = getNodeZone(neighbor.to);

        if (crowdStatus[zoneFrom] === 'high') penalty += 300;
        else if (crowdStatus[zoneFrom] === 'medium') penalty += 50;

        if (crowdStatus[zoneTo] === 'high') penalty += 300;
        else if (crowdStatus[zoneTo] === 'medium') penalty += 50;
      }

      const alt = minDist + neighbor.walk_seconds + penalty;
      if (alt < (distances.get(neighbor.to) ?? Infinity)) {
        distances.set(neighbor.to, alt);
        previous.set(neighbor.to, minNode);
      }
    }
  }

  const destDist = distances.get(destination);
  if (destDist === undefined || destDist === Infinity) {
    return null;
  }

  const path: string[] = [];
  let current: string | null = destination;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) ?? null;
  }

  const isFullyStepFree = path.every((nodeId) => nodesMap.get(nodeId)?.step_free ?? false);

  // Compute the exact physical seconds walked (excluding penalties)
  let physicalSeconds = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const f = path[i];
    const t = path[i + 1];
    const edge = edges.find((e) => (e.from === f && e.to === t) || (e.from === t && e.to === f));
    if (edge) {
      physicalSeconds += edge.walk_seconds;
    }
  }

  return {
    path,
    total_seconds: physicalSeconds,
    step_free: isFullyStepFree,
  };
}

/**
 * Dijkstra shortest-path function with crowd penalties and rerouting detection
 * @param origin Start node ID
 * @param destination End node ID
 * @param step_free_only Filter for step-free only paths
 * @param crowdStatus In-memory crowd density statuses
 */
export function findShortestPath(
  origin: string,
  destination: string,
  step_free_only: boolean,
  crowdStatus?: Record<string, "low" | "medium" | "high">
): (PathResult & { rerouted_around_crowds?: boolean }) | null {
  const normalPathResult = calculateDijkstra(origin, destination, step_free_only, undefined);
  if (!normalPathResult) return null;

  if (!crowdStatus) {
    return normalPathResult;
  }

  const penalizedPathResult = calculateDijkstra(origin, destination, step_free_only, crowdStatus);
  if (!penalizedPathResult) {
    return normalPathResult;
  }

  const normalPathStr = normalPathResult.path.join(',');
  const penalizedPathStr = penalizedPathResult.path.join(',');
  const rerouted = normalPathStr !== penalizedPathStr;

  return {
    ...penalizedPathResult,
    rerouted_around_crowds: rerouted,
  };
}

/**
 * Find the nearest amenity of a given type from an origin node
 * @param origin Start node ID
 * @param amenityType Type of amenity to search for
 */
export function findNearestAmenity(origin: string, amenityType: string) {
  const candidates = stadiumGraph.nodes.filter(
    (n) => n.type === amenityType && n.id !== origin
  );
  let nearest: any = null;
  let minSeconds = Infinity;
  let shortestPathResult: any = null;

  for (const cand of candidates) {
    const res = findShortestPath(origin, cand.id, false);
    if (res && res.total_seconds < minSeconds) {
      minSeconds = res.total_seconds;
      nearest = cand;
      shortestPathResult = res;
    }
  }

  if (!nearest) return null;
  return {
    nearestNode: nearest,
    pathResult: shortestPathResult,
  };
}

