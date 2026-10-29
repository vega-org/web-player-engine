import type { PlaybackError } from '../core/playback-state';

export function normalizePlaybackError(error: unknown): PlaybackError {
  const timestamp = Date.now();
  const seen = new Set<object>();
  const describe = (value: unknown, depth = 0): unknown => {
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value) || depth > 4) return '[nested error]';
    seen.add(value);
    const result: Record<string, unknown> = {};
    // Preserve useful exception fields, including non-enumerable Error fields,
    // without copying request headers or other unrelated event data.
    for (const key of ['name', 'message', 'stack', 'code', 'errorCode', 'cause', 'error', 'reason']) {
      try {
        const field = (value as Record<string, unknown>)[key];
        if (field !== undefined) result[key] = describe(field, depth + 1);
      } catch { result[key] = '[unavailable]'; }
    }
    return result;
  };
  const rawDetails = typeof error === 'object' && error !== null
    ? JSON.stringify(describe(error), (_, value) => typeof value === 'bigint' ? value.toString() : value, 2)
    : String(error);
  const value = error && typeof error === 'object' ? error as Record<string, unknown> : null;
  const nested = value?.error && typeof value.error === 'object'
    ? value.error as Record<string, unknown> : null;
  const detail = value?.message ?? nested?.message ?? value?.reason;
  const text = error instanceof Error ? error.message
    : typeof detail === 'string' ? detail
    : typeof error === 'number' ? `Libmedia playback failed (code: ${error})`
    : typeof error === 'string' ? error : '';
  // Some library failures supply only the source URL. It is not an error
  // explanation, and signed URL credentials must not become a UI message.
  const msg = /^\s*(?:https?:|blob:|data:)/i.test(text)
    ? 'Playback failed. Libmedia did not provide an error reason.'
    : text || 'Playback failed. Libmedia did not provide an error reason.';
  const lowerMsg = msg.toLowerCase();

  let category: PlaybackError['category'] = 'UNKNOWN_ERROR';
  let recoverable = false;

  if (/webtorrent is unsupported/.test(lowerMsg)) {
    category='TORRENT_UNSUPPORTED';
  } else if (/torrent/.test(lowerMsg)) {
    category='TORRENT_ERROR'; recoverable=true;
  } else if (/chunkloaderror|loading chunk .*failed|failed to fetch dynamically imported module/.test(lowerMsg)) {
    category='PLAYER_ASSET_ERROR';
  } else if (/\bret:\s*-2097152\b/.test(lowerMsg)) {
    // libmedia cheap/error.ts: REQUEST_ERROR = -(1 << 21). This is a
    // worker/IPC request failure, not evidence of an unsupported container.
    category='PLAYER_INTERNAL_ERROR';
  } else if (/forbidden.*header|unsafe.*header|header.*not allowed|refused to set.*header/.test(lowerMsg)) {
    category = 'HEADERS_NOT_ALLOWED';
    recoverable = true;
  } else if (lowerMsg.includes('cors') || lowerMsg.includes('cross-origin')) {
    category = 'CORS_BLOCKED';
    recoverable = true;
  } else if (lowerMsg.includes('network') || lowerMsg.includes('failed to fetch') || lowerMsg.includes('offline') || lowerMsg.includes('timeout') || lowerMsg.includes('http')) {
    category = 'NETWORK_ERROR';
    recoverable = true;
  } else if (lowerMsg.includes('unsupported bitstream profile')) {
    category = 'UNSUPPORTED_VIDEO_CODEC';
    recoverable = true;
  } else if (lowerMsg.includes('format') || lowerMsg.includes('container') || lowerMsg.includes('demux') || lowerMsg.includes('open stream failed')) {
    category = 'UNSUPPORTED_CONTAINER';
    recoverable = false;
  } else if (lowerMsg.includes('video') && (lowerMsg.includes('codec') || lowerMsg.includes('decode'))) {
    category = 'UNSUPPORTED_VIDEO_CODEC';
    recoverable = true;
  } else if (lowerMsg.includes('audio') && (lowerMsg.includes('codec') || lowerMsg.includes('decode'))) {
    category = 'UNSUPPORTED_AUDIO_CODEC';
    recoverable = true;
  } else if (lowerMsg.includes('decode') || lowerMsg.includes('decoder')) {
    category = 'DECODER_FAILURE';
    recoverable = true;
  } else if (lowerMsg.includes('seek')) {
    category = 'SEEK_FAILURE';
    recoverable = true;
  }

  return {
    category,
    message: msg || 'An unknown playback error occurred',
    recoverable,
    timestamp,
    rawDetails,
  };
}
