// Side-effect module that registers every module shipped with
// Personal OS. Imported once from the app shell so module manifests
// evaluate at boot without an explicit registration step in every
// route or repository. Import order fixes the display order of the
// Settings toggle list.
//
// Slice E — Promise is registered here through the same mechanism as
// every Life Program. Promise appears first so its Home surface
// contribution (identity layer) sorts consistently under
// `listHomeSurfaces()`.

import '../features/frozen/promise/promiseModule';
import './smoking/manifest';
