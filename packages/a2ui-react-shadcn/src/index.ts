export { shadcnReactComponents } from './registry';
export { cn } from './lib/utils';

// UI primitives (re-exported so consumers can compose with the same look).
export * from './ui/button';
export * from './ui/card';
export * from './ui/input';
export * from './ui/textarea';
export * from './ui/label';
export * from './ui/tabs';
export * from './ui/dialog';
export * from './ui/checkbox';
export * from './ui/radio-group';
export * from './ui/toggle-group';
export * from './ui/slider';
export * from './ui/separator';

// A2UI-prop → class mapping tables (handy for extending/customizing).
export * from './variants';
