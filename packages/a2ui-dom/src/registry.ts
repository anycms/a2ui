import {
  audioPlayerBinder,
  buttonBinder,
  cardBinder,
  checkBoxBinder,
  choicePickerBinder,
  columnBinder,
  dateTimeInputBinder,
  dividerBinder,
  iconBinder,
  imageBinder,
  listBinder,
  modalBinder,
  rowBinder,
  sliderBinder,
  tabsBinder,
  textFieldBinder,
  textBinder,
  videoBinder,
} from '@anycms/a2ui-core';
import { createDomComponent } from './adapter';
import { audioPlayerView } from './components/audio';
import { buttonView } from './components/button';
import { cardView } from './components/card';
import { checkBoxView } from './components/checkbox';
import { choicePickerView } from './components/choice';
import { columnView } from './components/column';
import { dateTimeInputView } from './components/datetime';
import { dividerView } from './components/divider';
import { iconView } from './components/icon';
import { imageView } from './components/image';
import { listView } from './components/list';
import { modalView } from './components/modal';
import { rowView } from './components/row';
import { sliderView } from './components/slider';
import { tabsView } from './components/tabs';
import { textFieldView } from './components/textfield';
import { textView } from './components/text';
import { videoView } from './components/video';
import type { DomComponent, DomComponentRegistry } from './types';

/**
 * Basic Catalog component-type -> DomComponent map. All 18 components wired with
 * the same core binders (reused unchanged) and the vanilla-DOM Views.
 */
const components = new Map<string, DomComponent>([
  ['Text', createDomComponent(textBinder, textView)],
  ['Image', createDomComponent(imageBinder, imageView)],
  ['Icon', createDomComponent(iconBinder, iconView)],
  ['Video', createDomComponent(videoBinder, videoView)],
  ['AudioPlayer', createDomComponent(audioPlayerBinder, audioPlayerView)],
  ['Row', createDomComponent(rowBinder, rowView)],
  ['Column', createDomComponent(columnBinder, columnView)],
  ['List', createDomComponent(listBinder, listView)],
  ['Card', createDomComponent(cardBinder, cardView)],
  ['Tabs', createDomComponent(tabsBinder, tabsView)],
  ['Divider', createDomComponent(dividerBinder, dividerView)],
  ['Modal', createDomComponent(modalBinder, modalView)],
  ['Button', createDomComponent(buttonBinder, buttonView)],
  ['CheckBox', createDomComponent(checkBoxBinder, checkBoxView)],
  ['TextField', createDomComponent(textFieldBinder, textFieldView)],
  ['DateTimeInput', createDomComponent(dateTimeInputBinder, dateTimeInputView)],
  ['ChoicePicker', createDomComponent(choicePickerBinder, choicePickerView)],
  ['Slider', createDomComponent(sliderBinder, sliderView)],
]);

export const basicDomComponents: DomComponentRegistry = components;
