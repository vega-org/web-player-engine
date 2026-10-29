// Convert subtitle formatting into libmedia's existing ASS parser input.
// Never interpret subtitle text as browser HTML.
export function subtitleTextToAss(text) {
  const depth = {i: 0, b: 0, u: 0, s: 0};
  return text
    .replace(/<\s*(\/?)\s*(i|b|u|s)\s*>/gi, (_, closing, name) => {
      name = name.toLowerCase();
      depth[name] = Math.max(0, depth[name] + (closing ? -1 : 1));
      return `{\\${name}${depth[name] ? 1 : 0}}`;
    })
    .replace(/<br\s*\/?>/gi, '\\N')
    .replace(/\r?\n/g, '\\N')
    .replace(/&(lt|gt|amp|quot|apos|nbsp|lrm|rlm);/gi, (_, entity) => ({
      lt: '<', gt: '>', amp: '&', quot: '"', apos: "'", nbsp: '\\h', lrm: '', rlm: '',
    })[entity.toLowerCase()]);
}
