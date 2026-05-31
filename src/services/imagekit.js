// ImageKit configuration for mobile client
// Used to construct optimized, CDN-delivered URLs for recordings and media

export const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/4eqyb4rwe';

/**
 * Resolves a recording URL — if the URL is an ImageKit URL it is returned
 * as-is; if it is a relative server path it is prefixed with the backend host.
 *
 * @param {string} recordingUrl  - URL stored in the database (can be IK URL or relative /recordings/...)
 * @param {string} backendBase   - Base URL of your backend (e.g. http://10.0.2.2:3000)
 * @returns {string}             - Fully qualified playback URL
 */
export function resolveRecordingUrl(recordingUrl, backendBase) {
  if (!recordingUrl) return null;

  // Already an absolute URL (ImageKit CDN or any other host)
  if (recordingUrl.startsWith('http://') || recordingUrl.startsWith('https://')) {
    return recordingUrl;
  }

  // Relative path — prepend the backend server base URL
  return `${backendBase}${recordingUrl}`;
}

/**
 * Returns an ImageKit transformation URL with optional width/quality params.
 * Useful for future image assets (e.g. company logo, lead avatars).
 *
 * @param {string} imagePath     - Path within your ImageKit project (e.g. /logo.png)
 * @param {object} [transforms]  - Optional { width, height, quality } overrides
 * @returns {string}             - Full ImageKit CDN URL
 */
export function ikImageUrl(imagePath, transforms = {}) {
  const { width, height, quality = 80 } = transforms;

  let params = `tr=q-${quality}`;
  if (width) params += `,w-${width}`;
  if (height) params += `,h-${height}`;

  const separator = imagePath.includes('?') ? '&' : '?';
  return `${IMAGEKIT_URL_ENDPOINT}${imagePath}${separator}${params}`;
}
