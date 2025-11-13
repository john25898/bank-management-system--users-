import type { PluginOption } from 'vite';

declare module 'lovable-tagger' {
  export function componentTagger(): PluginOption;
}
