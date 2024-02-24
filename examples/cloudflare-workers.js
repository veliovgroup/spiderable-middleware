const BOT_AGENTS = [
  'googlebot',
  'yahoo! slurp',
  'bingbot',
  'yandex',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest/0.',
  'developers.google.com/+/web/snippet',
  'slackbot',
  'vkshare',
  'w3c_validator',
  'redditbot',
  'applebot',
  'whatsapp',
  'flipboard',
  'tumblr',
  'bitlybot',
  'skypeuripreview',
  'nuzzel',
  'discordbot',
  'google page speed',
  'qwantify',
  'pinterestbot',
  'bitrix link preview',
  'xing-contenttabreceiver',
  'chrome-lighthouse',
  'telegrambot',
  'integration-test', // Integration testing
  'google-inspectiontool',
  'ahrefs'
];

// These are the extensions that the worker will skip prerendering
// even if any other conditions pass.
const IGNORE_EXTENSIONS = [
  '.js',
  '.css',
  '.xml',
  '.less',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.pdf',
  '.doc',
  '.txt',
  '.ico',
  '.rss',
  '.zip',
  '.mp3',
  '.rar',
  '.exe',
  '.wmv',
  '.doc',
  '.avi',
  '.ppt',
  '.mpg',
  '.mpeg',
  '.tif',
  '.wav',
  '.mov',
  '.psd',
  '.ai',
  '.xls',
  '.mp4',
  '.m4a',
  '.swf',
  '.dat',
  '.dmg',
  '.iso',
  '.flv',
  '.m4v',
  '.torrent',
  '.woff',
  '.ttf',
  '.svg',
  '.webmanifest',
];

export default {
  /**
   * Hooks into the request, and changes origin if needed
   */
  async fetch(request, env) {
    return await handleRequest(request, env).catch((err) => new Response(err.stack, { status: 500 }));
  },
};

/**
 * @param {Request} request
 * @param {any} env
 * @returns {Promise<Response>}
 */
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent')?.toLowerCase() || '';
  const pathName = url.pathname.toLowerCase();
  const extension = pathName.substring(pathName.lastIndexOf('.') || pathName.length)?.toLowerCase();


  // # Avoid dead loop and drop get query
  const isOstr =   url.origin.includes('ostr.io')
  
  if (
    isOstr ||
    !BOT_AGENTS.some((bot) => userAgent.includes(bot)) ||
    (extension.length && IGNORE_EXTENSIONS.includes(extension))
  ) {
    return fetch(request);
  }

  const newURL = `https://${env.OSTR_USER}:${env.OSTR_PASS}@render-bypass.ostr.io/?url=${request.url}&bot=${userAgent}`;
  const newHeaders = new Headers(request.headers);

  return fetch(
    new Request(newURL, {
      headers: newHeaders,
      redirect: 'manual',
    })
  );
}
