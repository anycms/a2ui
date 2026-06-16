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
import { createReactComponent, type ReactComponentRegistry } from './adapter';
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

/** Basic-catalog component type -> React component map. */
export const basicReactComponents: ReactComponentRegistry = new Map([
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

/**
 * Merge registries into a new `ReadonlyMap`; later args override earlier by
 * component `type`. Inputs are not mutated. Generic — re-exported from
 * `@anycms/a2ui-core`; passing `ReactComponentRegistry` maps infers a
 * `ReactComponentRegistry` result.
 *
 * @example
 *   const branded = mergeRegistries(basicReactComponents, brandOverrides);
 */
export { mergeRegistries } from '@anycms/a2ui-core';
