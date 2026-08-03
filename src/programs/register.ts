// Side-effect module that registers every Life Program shipped with
// Personal OS. Imported once from the app shell so program manifests
// evaluate at boot without an explicit registration step in every
// route or repository. Import order fixes the display order of the
// Settings toggle list.

import './smoking/manifest';
