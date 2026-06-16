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
import { createVueComponent, type VueComponentRegistry } from './adapter';
import {
  AudioPlayerView,
  ButtonView,
  CardView,
  CheckBoxView,
  ChoicePickerView,
  ColumnView,
  DateTimeInputView,
  DividerView,
  IconView,
  ImageView,
  ListView,
  ModalView,
  RowView,
  SliderView,
  TabsView,
  TextView,
  TextFieldView,
  VideoView,
} from './components';

/** Basic-catalog component type -> Vue component map. */
export const basicVueComponents: VueComponentRegistry = new Map([
  ['Text', createVueComponent(textBinder, TextView)],
  ['Image', createVueComponent(imageBinder, ImageView)],
  ['Icon', createVueComponent(iconBinder, IconView)],
  ['Video', createVueComponent(videoBinder, VideoView)],
  ['AudioPlayer', createVueComponent(audioPlayerBinder, AudioPlayerView)],
  ['Row', createVueComponent(rowBinder, RowView)],
  ['Column', createVueComponent(columnBinder, ColumnView)],
  ['List', createVueComponent(listBinder, ListView)],
  ['Card', createVueComponent(cardBinder, CardView)],
  ['Tabs', createVueComponent(tabsBinder, TabsView)],
  ['Divider', createVueComponent(dividerBinder, DividerView)],
  ['Modal', createVueComponent(modalBinder, ModalView)],
  ['Button', createVueComponent(buttonBinder, ButtonView)],
  ['CheckBox', createVueComponent(checkBoxBinder, CheckBoxView)],
  ['TextField', createVueComponent(textFieldBinder, TextFieldView)],
  ['DateTimeInput', createVueComponent(dateTimeInputBinder, DateTimeInputView)],
  ['ChoicePicker', createVueComponent(choicePickerBinder, ChoicePickerView)],
  ['Slider', createVueComponent(sliderBinder, SliderView)],
]);

/**
 * Merge registries into a new `ReadonlyMap`; later args override earlier by
 * component `type`. Inputs are not mutated. Generic — re-exported from
 * `@anycms/a2ui-core`; the value type is inferred from the args.
 */
export { mergeRegistries } from '@anycms/a2ui-core';
