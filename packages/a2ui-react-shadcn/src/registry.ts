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
import { createReactComponent, type ReactComponentRegistry } from '@anycms/a2ui-react';
import { TextView } from './components/text';
import { ImageView } from './components/image';
import { IconView } from './components/icon';
import { VideoView, AudioPlayerView } from './components/media';
import { RowView, ColumnView } from './components/row-column';
import { ListView } from './components/list';
import { CardView } from './components/card';
import { TabsView } from './components/tabs';
import { DividerView } from './components/divider';
import { ModalView } from './components/modal';
import { ButtonView } from './components/button';
import { CheckBoxView } from './components/checkbox';
import { TextFieldView } from './components/text-field';
import { DateTimeInputView } from './components/date-time-input';
import { ChoicePickerView } from './components/choice-picker';
import { SliderView } from './components/slider';

/**
 * shadcn/ui + Tailwind registry for the basic catalog. Pass to `<A2uiSurface registry=...>`:
 *
 *   import { A2uiSurface } from '@anycms/a2ui-react';
 *   import { shadcnReactComponents } from '@anycms/a2ui-react-shadcn';
 *   <A2uiSurface surface={s} registry={shadcnReactComponents} />
 *
 * The binders and adapter are reused from core / @anycms/a2ui-react — only the
 * presentation layer (the Views) differs from the default vanilla registry.
 */
export const shadcnReactComponents: ReactComponentRegistry = new Map([
  ['Text', createReactComponent(textBinder, TextView)],
  ['Image', createReactComponent(imageBinder, ImageView)],
  ['Icon', createReactComponent(iconBinder, IconView)],
  ['Video', createReactComponent(videoBinder, VideoView)],
  ['AudioPlayer', createReactComponent(audioPlayerBinder, AudioPlayerView)],
  ['Row', createReactComponent(rowBinder, RowView)],
  ['Column', createReactComponent(columnBinder, ColumnView)],
  ['List', createReactComponent(listBinder, ListView)],
  ['Card', createReactComponent(cardBinder, CardView)],
  ['Tabs', createReactComponent(tabsBinder, TabsView)],
  ['Divider', createReactComponent(dividerBinder, DividerView)],
  ['Modal', createReactComponent(modalBinder, ModalView)],
  ['Button', createReactComponent(buttonBinder, ButtonView)],
  ['CheckBox', createReactComponent(checkBoxBinder, CheckBoxView)],
  ['TextField', createReactComponent(textFieldBinder, TextFieldView)],
  ['DateTimeInput', createReactComponent(dateTimeInputBinder, DateTimeInputView)],
  ['ChoicePicker', createReactComponent(choicePickerBinder, ChoicePickerView)],
  ['Slider', createReactComponent(sliderBinder, SliderView)],
]);
