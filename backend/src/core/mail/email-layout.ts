/**
 * Shared email shell. Templates are intentionally table-based with inline
 * styles — that is the only thing email clients (Outlook, Gmail, Apple Mail)
 * render reliably. Keep new markup in the same defensive style.
 */

const BRAND = '#10B5CB'; // hsl(187 85% 43%) — matches the app's --primary
const BRAND_DARK = '#0E94A6';
const TEXT = '#1f2933';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const BG = '#f4f6f8';
const YEAR = new Date().getFullYear();

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

interface LayoutOptions {
  /** Hidden inbox preview text shown after the subject in most clients. */
  preheader: string;
  heading: string;
  /** Paragraphs rendered above the call-to-action button. */
  intro: string[];
  buttonLabel?: string;
  buttonUrl?: string;
  /** Muted paragraphs rendered below the button (e.g. expiry, disclaimers). */
  footnotes: string[];
}

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const paragraph = (text: string, color: string, size = 16): string =>
  `<p style="margin:0 0 16px;color:${color};font-size:${size}px;line-height:1.6;">${text}</p>`;

/** Wraps content in the shared branded shell. */
export const layout = (options: LayoutOptions): string => {
  const intro = options.intro
    .map((line) => paragraph(escapeHtml(line), TEXT))
    .join('');
  const footnotes = options.footnotes
    .map((line) => paragraph(escapeHtml(line), MUTED, 14))
    .join('');
  const safeUrl = options.buttonUrl ? escapeHtml(options.buttonUrl) : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(options.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BG};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
      options.preheader,
    )}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background-color:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${BRAND};padding:24px 32px;">
                <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Forgeng</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <h1 style="margin:0 0 20px;color:${TEXT};font-size:22px;line-height:1.3;">${escapeHtml(
                  options.heading,
                )}</h1>
                ${intro}
                ${
                  options.buttonLabel && safeUrl
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td align="center" bgcolor="${BRAND}" style="border-radius:8px;">
                      <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:${BRAND};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(
                        options.buttonLabel,
                      )}</a>
                    </td>
                  </tr>
                </table>
                ${paragraph(
                  `Button not working? Copy and paste this link into your browser:<br /><a href="${safeUrl}" target="_blank" style="color:${BRAND_DARK};word-break:break-all;">${safeUrl}</a>`,
                  MUTED,
                  14,
                )}`
                    : ''
                }
                ${footnotes}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${BORDER};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.5;">© ${YEAR} Forgeng. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
