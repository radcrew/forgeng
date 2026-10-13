import { register } from 'tsconfig-paths';

// Resolve the tsconfig.json path aliases at runtime without reading
// tsconfig.json. Vercel compiles src/ in place and does not ship tsconfig.json
// or run tsc-alias, so `tsconfig-paths/register` finds nothing there. Paths are
// relative to this file, so they work from both src/ (Vercel) and dist/.
// Keep in sync with `paths` in tsconfig.json.
register({
  baseUrl: __dirname,
  paths: {
    '@core/*': ['core/*'],
    '@common/*': ['common/*'],
    '@config': ['config'],
    '@config/*': ['config/*'],
    '@modules/*': ['modules/*'],
  },
});
