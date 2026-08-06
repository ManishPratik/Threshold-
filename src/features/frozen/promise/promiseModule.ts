import { registerModule } from '@kernel/registry';
import { PromiseHomeSurface } from './PromiseHomeSurface';

/**
 * Slice E — Home multi-module composition.
 *
 * Registers Promise as a first-class module through the same
 * `registerModule` mechanism used by Life Programs (e.g., Smoking at
 * `src/programs/smoking/manifest.ts:6`). Promise's contribution to
 * Home is a single `identity`-layer surface that Home discovers via
 * `listHomeSurfaces()` at `src/kernel/registry/index.ts:75`.
 *
 * Not a Slice 8 file relocation: existing Promise domain code
 * (PromiseService at `src/features/frozen/promise/PromiseService.ts`,
 * plus every downstream repository at
 * `src/data/repositories/frozen/PromiseRepository.ts` etc.) stays
 * exactly where it is. This registration file is additive.
 *
 * Side-effect import: `src/programs/register.ts` imports this module
 * so the registration fires at boot before Home mounts.
 */
registerModule({
  id: 'promise',
  displayName: 'Promise',
  description:
    'A promise you make to yourself, witnessed each day. Anchor, routine, self-trust, reflection.',
  homeSurfaces: [
    {
      layer: 'identity',
      component: PromiseHomeSurface,
      weight: 100,
    },
  ],
});
