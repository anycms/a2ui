export { A2uiSurface } from './Surface';
export type { A2uiSurfaceProps } from './Surface';
export {
  createVueComponent,
  A2uiNode,
  buildChildNode,
  childKey,
  SURFACE_INJECTION_KEY,
  useSurfaceContext,
} from './adapter';
export type {
  ComponentViewProps,
  VueView,
  VueComponent,
  VueComponentRegistry,
  SurfaceContextValue,
} from './adapter';
export { basicVueComponents, mergeRegistries } from './registry';
export * from './components';
