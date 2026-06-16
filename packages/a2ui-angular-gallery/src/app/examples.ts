import type { A2uiMessage } from '@anycms/a2ui-core';

// Curated offline business examples, loaded directly from the official
// basic-catalog examples. Each file is { name, description, messages } and the
// message envelopes are schema-identical to what MessageProcessor accepts, so
// they process verbatim. (The Vue gallery loads the same set via import.meta.glob.)
import weatherCurrent from '../../../../a2ui/specification/v1_0/catalogs/basic/examples/04_weather-current.json';
import musicPlayer from '../../../../a2ui/specification/v1_0/catalogs/basic/examples/06_music-player.json';
import loginForm from '../../../../a2ui/specification/v1_0/catalogs/basic/examples/09_login-form.json';
import coffeeOrder from '../../../../a2ui/specification/v1_0/catalogs/basic/examples/13_coffee-order.json';
import recipeCard from '../../../../a2ui/specification/v1_0/catalogs/basic/examples/24_recipe-card.json';
import podcastEpisode from '../../../../a2ui/specification/v1_0/catalogs/basic/examples/26_podcast-episode.json';
import childListTemplate from '../../../../a2ui/specification/v1_0/catalogs/basic/examples/34_child-list-template.json';
import modal from '../../../../a2ui/specification/v1_0/catalogs/basic/examples/36_modal.json';

export interface Example {
  name: string;
  description: string;
  messages: A2uiMessage[];
}

export const EXAMPLES: Example[] = [
  weatherCurrent,
  musicPlayer,
  loginForm,
  coffeeOrder,
  recipeCard,
  podcastEpisode,
  childListTemplate,
  modal,
] as unknown as Example[];
