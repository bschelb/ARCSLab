/**
 * Technical-drawing figures for the research areas (D14: option A's team topologies on the
 * research page). Each is a conceptual diagram, not data: humans are circles, AI agents are
 * squares, boxes are settings, and orange signals travel the routes marked `signal`.
 * Coordinates are in a 440 × 300 drawing.
 */
export type FigNode =
  | { kind: 'human'; x: number; y: number; label: string }
  | { kind: 'ai'; x: number; y: number; label: string; compromised?: boolean }
  | { kind: 'box'; x: number; y: number; w: number; h: number; label: string };

export interface FigRoute {
  d: string;
  dashed?: boolean;
  signal?: boolean;
}

export interface FigNote {
  x: number;
  y: number;
  text: string;
  anchor?: 'start' | 'middle' | 'end';
}

export interface Figure {
  caption: string;
  detail: string;
  /** Plain-language description for screen readers. */
  alt: string;
  nodes: FigNode[];
  routes: FigRoute[];
  notes: FigNote[];
}

export const FIGURES: Record<string, Figure> = {
  'human-ai-teaming': {
    caption: 'Team topology',
    detail: '3 humans · 2 AI agents',
    alt: 'Diagram of a human-AI team: three humans and two AI agents linked by routes labeled shared mental model, transactive memory and situation awareness.',
    nodes: [
      { kind: 'human', x: 70, y: 70, label: 'H1' },
      { kind: 'human', x: 70, y: 230, label: 'H2' },
      { kind: 'human', x: 230, y: 150, label: 'H3' },
      { kind: 'ai', x: 370, y: 70, label: 'AI-1' },
      { kind: 'ai', x: 370, y: 230, label: 'AI-2' },
    ],
    routes: [
      { d: 'M90 70 H170 V150 H210', signal: true },
      { d: 'M90 230 H170 V150', signal: true },
      { d: 'M250 150 H310 V70 H350', signal: true },
      { d: 'M250 150 H310 V230 H350', signal: true },
      { d: 'M370 90 V210', dashed: true },
    ],
    notes: [
      { x: 98, y: 60, text: 'SHARED MENTAL MODEL' },
      { x: 258, y: 140, text: 'TRANSACTIVE MEMORY' },
      { x: 382, y: 154, text: 'SA LINK' },
    ],
  },
  'trustworthy-ai': {
    caption: 'Trust loop',
    detail: 'Calibration · violation · repair',
    alt: 'Diagram of a trust loop between a human and an AI teammate: reliance flows one way, transparency flows back, and a dashed break marks a trust violation followed by repair.',
    nodes: [
      { kind: 'human', x: 80, y: 150, label: 'H1' },
      { kind: 'ai', x: 360, y: 150, label: 'AI-1' },
    ],
    routes: [
      { d: 'M80 130 V70 H360 V130', signal: true },
      { d: 'M360 170 V230 H80 V170', signal: true },
      { d: 'M250 88 V212', dashed: true },
    ],
    notes: [
      { x: 220, y: 60, text: 'RELIANCE', anchor: 'middle' },
      { x: 220, y: 250, text: 'TRANSPARENCY', anchor: 'middle' },
      { x: 258, y: 146, text: 'VIOLATION →' },
      { x: 258, y: 160, text: 'REPAIR' },
      { x: 112, y: 154, text: 'TRUST CALIBRATION' },
    ],
  },
  training: {
    caption: 'Skill transfer',
    detail: 'Training environment → operations',
    alt: 'Diagram of skill transfer: a human and an AI teammate in a training environment, with routes carrying their skills into an operational setting.',
    nodes: [
      { kind: 'box', x: 30, y: 50, w: 160, h: 200, label: 'TRAINING ENV' },
      { kind: 'box', x: 250, y: 50, w: 160, h: 200, label: 'OPERATIONS' },
      { kind: 'human', x: 90, y: 120, label: 'H1' },
      { kind: 'ai', x: 130, y: 195, label: 'AI-1' },
      { kind: 'human', x: 310, y: 120, label: 'H1' },
      { kind: 'ai', x: 350, y: 195, label: 'AI-1' },
    ],
    routes: [
      { d: 'M110 120 H290', signal: true },
      { d: 'M150 195 H330', signal: true },
      { d: 'M90 140 V195 H110', dashed: true },
      { d: 'M310 140 V195 H330', dashed: true },
    ],
    notes: [
      { x: 220, y: 110, text: 'SKILL TRANSFER', anchor: 'middle' },
      { x: 220, y: 270, text: 'PSYCHOLOGICAL FIDELITY', anchor: 'middle' },
    ],
  },
  'situational-awareness': {
    caption: 'Shared situation awareness',
    detail: '2 humans · 2 AI agents · 1 compromised',
    alt: 'Diagram of shared situation awareness: two humans and two AI agents feed a common operating picture; one AI agent is marked compromised and its dashed route is flagged.',
    nodes: [
      { kind: 'box', x: 170, y: 115, w: 100, h: 70, label: 'SHARED SA' },
      { kind: 'human', x: 60, y: 70, label: 'H1' },
      { kind: 'human', x: 60, y: 230, label: 'H2' },
      { kind: 'ai', x: 380, y: 70, label: 'AI-1' },
      { kind: 'ai', x: 380, y: 230, label: 'AI-X', compromised: true },
    ],
    routes: [
      { d: 'M80 70 H200 V115', signal: true },
      { d: 'M80 230 H200 V185', signal: true },
      { d: 'M360 70 H240 V115', signal: true },
      { d: 'M360 230 H240 V185', dashed: true },
    ],
    notes: [
      { x: 300, y: 262, text: 'COMPROMISED · DETECTED', anchor: 'middle' },
      { x: 220, y: 156, text: 'COMMON PICTURE', anchor: 'middle' },
    ],
  },
  'applied-robotics': {
    caption: 'Human-robot handoff',
    detail: 'Adjustable autonomy',
    alt: 'Diagram of a human handing a task to a robotic teammate, with an autonomy scale from one to five beneath them.',
    nodes: [
      { kind: 'human', x: 80, y: 120, label: 'H1' },
      { kind: 'ai', x: 360, y: 120, label: 'UGV' },
      { kind: 'box', x: 60, y: 210, w: 320, h: 34, label: 'AUTONOMY LEVEL' },
    ],
    routes: [
      { d: 'M100 110 H340', signal: true },
      { d: 'M340 130 H100', signal: true },
      { d: 'M140 210 V244 M204 210 V244 M268 210 V244 M332 210 V244', dashed: true },
    ],
    notes: [
      { x: 220, y: 100, text: 'HANDOFF', anchor: 'middle' },
      { x: 220, y: 150, text: 'MONITOR', anchor: 'middle' },
      { x: 100, y: 262, text: '1', anchor: 'middle' },
      { x: 236, y: 262, text: '3', anchor: 'middle' },
      { x: 364, y: 262, text: '5', anchor: 'middle' },
    ],
  },
  'evaluation-validation': {
    caption: 'Experimental design',
    detail: 'Conditions → team task → measures',
    alt: 'Diagram of an experiment: two conditions feed a human-AI team task, whose results flow into measures of trust, situation awareness and performance.',
    nodes: [
      { kind: 'box', x: 20, y: 60, w: 100, h: 60, label: 'CONDITION A' },
      { kind: 'box', x: 20, y: 180, w: 100, h: 60, label: 'CONDITION B' },
      { kind: 'box', x: 160, y: 95, w: 120, h: 110, label: 'TEAM TASK' },
      { kind: 'human', x: 195, y: 160, label: 'H' },
      { kind: 'ai', x: 245, y: 160, label: 'AI' },
      { kind: 'box', x: 320, y: 70, w: 100, h: 160, label: 'MEASURES' },
    ],
    routes: [
      { d: 'M120 90 H140 V130 H160', signal: true },
      { d: 'M120 210 H140 V170 H160', signal: true },
      { d: 'M280 150 H320', signal: true },
      { d: 'M215 160 H225', dashed: true },
    ],
    notes: [
      { x: 332, y: 120, text: 'TRUST' },
      { x: 332, y: 150, text: 'SA' },
      { x: 332, y: 180, text: 'PERFORMANCE' },
    ],
  },
};
