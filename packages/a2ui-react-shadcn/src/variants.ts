/**
 * A2UI prop union → shadcn/Tailwind class mappings. The View components consume
 * these tables so the prop-to-style logic lives in one auditable place, mirroring
 * the vanilla renderer's JUSTIFY/ALIGN/TEXT_SIZE tables.
 */

// --- Text ---
// A2UI Text.variant → Tailwind typography classes.
export const TEXT_VARIANT: Record<string, string> = {
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold tracking-tight',
  h4: 'text-xl font-medium',
  h5: 'text-lg font-medium',
  caption: 'text-sm text-muted-foreground italic',
  body: 'text-base',
};

// --- Image ---
// A2UI Image.variant → sizing/shape classes.
export const IMAGE_VARIANT: Record<string, string> = {
  icon: 'w-6 h-6',
  avatar: 'w-10 h-10 rounded-full',
  smallFeature: 'w-24 h-24',
  mediumFeature: 'max-w-xs',
  largeFeature: 'w-full max-h-[400px]',
  header: 'w-full h-[200px]',
};
// A2UI Image.fit → object-fit utility.
export const IMAGE_FIT: Record<string, string> = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill',
  none: 'object-none',
  scaleDown: 'object-scale-down',
};

// --- Row / Column (ContainerProps) ---
// A2UI justify/align → flex utilities.
export const JUSTIFY: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  spaceBetween: 'justify-between',
  spaceAround: 'justify-around',
  spaceEvenly: 'justify-evenly',
  stretch: 'justify-stretch',
};
export const ALIGN: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

// --- List ---
export const LIST_DIRECTION: Record<string, string> = {
  vertical: 'flex flex-col',
  horizontal: 'flex flex-row overflow-x-auto',
};

// --- Button ---
// A2UI Button.variant → shadcn button variant.
export const BUTTON_VARIANT: Record<string, 'default' | 'ghost' | 'outline'> = {
  primary: 'default',
  borderless: 'ghost',
  default: 'outline',
};

// --- TextField ---
// A2UI TextField.variant → input element.
export const TEXTFIELD_TYPE: Record<string, string> = {
  shortText: 'text',
  longText: 'text',
  number: 'number',
  obscured: 'password',
};

// --- ChoicePicker ---
// A2UI ChoicePicker.displayStyle → layout classes.
export const CHOICE_GAP: Record<string, string> = {
  checkbox: 'gap-2',
  chips: 'gap-2 flex-wrap',
};
