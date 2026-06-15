// Public API — framework-agnostic vanilla-DOM renderer for A2UI v1.0.

export { mountDomSurface } from './surface';
export type { DomSurfaceHandle, MountDomSurfaceOptions } from './surface';

export { createDomComponent } from './adapter';

export { basicDomComponents } from './registry';

export {
  mountChild,
  reconcileChildren,
  childKey,
  boundPath,
  dispatchButtonAction,
  applyButtonVariant,
  LEAF_MARGIN,
  JUSTIFY,
  ALIGN,
  TEXT_SIZE,
  IMAGE_FIT,
  TEXTFIELD_TYPE,
} from './helpers';
export type { ButtonAction } from './helpers';

export type {
  DomComponent,
  DomComponentRegistry,
  DomNodeMount,
  DomView,
  DomViewContext,
} from './types';

// Re-export all 18 component Views so consumers can build custom registries.
export { textView } from './components/text';
export { imageView } from './components/image';
export { iconView } from './components/icon';
export { videoView } from './components/video';
export { audioPlayerView } from './components/audio';
export { dividerView } from './components/divider';
export { rowView } from './components/row';
export { columnView } from './components/column';
export { listView } from './components/list';
export { cardView } from './components/card';
export { tabsView } from './components/tabs';
export { modalView } from './components/modal';
export { buttonView } from './components/button';
export { checkBoxView } from './components/checkbox';
export { textFieldView } from './components/textfield';
export { dateTimeInputView } from './components/datetime';
export { choicePickerView } from './components/choice';
export { sliderView } from './components/slider';
