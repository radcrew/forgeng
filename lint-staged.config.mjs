/** @type {import('lint-staged').Configuration} */
export default {
  'frontend/**/*.{ts,tsx,mjs,js,jsx}': (files) => {
    const relative = files.map((f) => f.replace(/^frontend[/\\]/, ''));
    if (relative.length === 0) return [];
    return [
      `pnpm -C frontend exec eslint --max-warnings 0 ${quotePaths(relative)}`,
    ];
  },
  'backend/{src,test}/**/*.ts': (files) => {
    const relative = files.map((f) => f.replace(/^backend[/\\]/, ''));
    if (relative.length === 0) return [];
    return [
      `pnpm -C backend exec eslint --max-warnings 0 ${quotePaths(relative)}`,
    ];
  },
};

/** @param {string[]} paths */
function quotePaths(paths) {
  return paths.map((p) => `"${p.replace(/"/g, '\\"')}"`).join(' ');
}
