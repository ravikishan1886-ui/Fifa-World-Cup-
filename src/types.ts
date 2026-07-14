/**
 * Types for Compass26 Stadium Venue Graph and Chat Assistance
 */

export type NodeType =
  | 'gate'
  | 'seating'
  | 'restroom'
  | 'concession'
  | 'medical'
  | 'guest_services'
  | 'exit';

export interface VenueNode {
  id: string;
  name: string;
  type: NodeType;
  x: number; // 0 to 100 on the visual coordinate plane
  y: number; // 0 to 100 on the visual coordinate plane
  step_free: boolean;
}

export interface VenueEdge {
  from: string;
  to: string;
  walk_seconds: number;
}

export interface VenueGraph {
  nodes: VenueNode[];
  edges: VenueEdge[];
}

export interface PathResult {
  path: string[]; // List of node IDs in sequence
  total_seconds: number;
  step_free: boolean;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  image?: string; // Base64 data-uri of captured photo
  translationOverlay?: string; // Extracted and translated text overlay
  locationQuery?: {
    origin: string;
    destination: string;
    stepFreeOnly: boolean;
  };
}

export type SupportedLanguage = 'auto' | 'en' | 'es' | 'pt' | 'fr' | 'ar';
