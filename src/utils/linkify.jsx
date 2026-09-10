import { Fragment } from 'react';

// Matches http(s):// URLs and bare www.-prefixed domains inside plain text.
const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi;
// Trailing punctuation that's almost always sentence punctuation, not part of the URL.
const TRAILING_PUNCT_RE = /[.,!?;:'")\]}]+$/;

/**
 * Turns plain text containing URLs into clickable links, leaving everything
 * else as plain text (no HTML is parsed or injected — safe for post content
 * that was never sanitized as HTML). Clicking a link asks for confirmation
 * before leaving the app, since the destination is user-supplied.
 */
export function linkifyText(text, keyPrefix = 'lnk') {
  if (!text) return text;
  const segments = String(text).split(URL_RE);
  if (segments.length === 1) return text;

  return segments.map((segment, i) => {
    // split() with one capturing group alternates plain text / match / plain text…
    if (i % 2 === 0) return segment || null;

    const trailingMatch = segment.match(TRAILING_PUNCT_RE);
    const trailing = trailingMatch ? trailingMatch[0] : '';
    const label = trailing ? segment.slice(0, -trailing.length) : segment;
    if (!label) return segment;

    const href = label.startsWith('http') ? label : `https://${label}`;
    return (
      <Fragment key={`${keyPrefix}-${i}`}>
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault();
            if (window.confirm(`הקישור יוצא מחברותא 186 לאתר חיצוני:\n${href}\n\nלהמשיך?`)) {
              window.open(href, '_blank', 'noopener,noreferrer');
            }
          }}
          className="text-accent underline decoration-accent-300 hover:decoration-accent break-all"
        >
          {label}
        </a>
        {trailing}
      </Fragment>
    );
  });
}
