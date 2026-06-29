import { renderFormBody } from '../../utils/formRender.js';

const LOGO_SRC = '/izraeli-logo.png';

const PALETTE = {
  olive:    '#6B7D5F',
  blue:     '#1E40AF',
  bordeaux: '#881337',
  charcoal: '#374151',
  forest:   '#14532D',
};

function Letterhead({ theme, color, orgName }) {
  if (theme === 'modern') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 24,
        paddingBottom: 14,
        borderBottom: `3px solid ${color}`,
      }}>
        <img src={LOGO_SRC} alt="לוגו" crossOrigin="anonymous"
          style={{ height: 56, flexShrink: 0 }} />
        {orgName && (
          <div style={{ fontSize: 17, fontWeight: 700, color }}>{orgName}</div>
        )}
      </div>
    );
  }

  if (theme === 'classic') {
    return (
      <div style={{
        textAlign: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottom: '1px solid #d1d5db',
      }}>
        <img src={LOGO_SRC} alt="לוגו" crossOrigin="anonymous"
          style={{ height: 56, display: 'block', margin: '0 auto 6px' }} />
        {orgName && (
          <div style={{ fontSize: 13, color: '#6b7280' }}>{orgName}</div>
        )}
      </div>
    );
  }

  // 'official' — default
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <img src={LOGO_SRC} alt="לוגו" crossOrigin="anonymous"
        style={{ height: 72, display: 'block', margin: '0 auto 8px' }} />
      {orgName && (
        <div style={{ fontSize: 16, fontWeight: 700, color, letterSpacing: 0.3 }}>{orgName}</div>
      )}
      <div style={{
        height: 2,
        marginTop: 12,
        background: `linear-gradient(to left, transparent, ${color} 30%, ${color} 70%, transparent)`,
      }} />
    </div>
  );
}

function SigBlock({ label, img }) {
  return (
    <div style={{ flex: '0 0 auto', width: 210, textAlign: 'center' }}>
      <div style={{
        height: 70,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        borderBottom: '1px solid #1a1a1a',
        paddingBottom: 4,
      }}>
        {img && (
          <img src={img} alt="חתימה" crossOrigin="anonymous"
            style={{ maxHeight: 66, maxWidth: '100%', objectFit: 'contain' }} />
        )}
      </div>
      {label && (
        <div style={{ marginTop: 6, fontSize: 13, color: '#444' }}>{label}</div>
      )}
    </div>
  );
}

// Renders a form as a printable A4-styled document.
// mode: 'fill' (blanks for empty) | 'template' (labeled chips for empty)
export default function FormDocument({ form, values = {}, userSignature = '', mode = 'fill', innerRef }) {
  const bodyHtml = renderFormBody(form.bodyHtml, form.fields, values, mode);
  const showUserSig = !!form.requireUserSignature;
  const showAdminSig = !!form.adminSignatureUrl;
  const color = PALETTE[form.colorKey] || PALETTE.olive;
  const theme = form.theme || 'official';
  const orgName = form.organization?.name || '';

  let sigJustify = 'flex-start';
  if (showAdminSig && !showUserSig) sigJustify = 'flex-end';   // admin only → visual left in RTL
  else if (showUserSig && showAdminSig) sigJustify = 'space-between';

  return (
    <div
      ref={innerRef}
      dir="rtl"
      style={{
        background: '#ffffff',
        color: '#1a1a1a',
        padding: '36px 40px',
        fontFamily: theme === 'classic'
          ? '"Times New Roman", "David", Georgia, serif'
          : 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
        fontSize: 15,
        lineHeight: 1.8,
        boxSizing: 'border-box',
      }}
    >
      <Letterhead theme={theme} color={color} orgName={orgName} />

      {form.title && (
        <h1 style={{
          fontSize: theme === 'classic' ? 19 : 20,
          fontWeight: 800,
          margin: '0 0 20px',
          textAlign: theme === 'official' ? 'center' : 'right',
          color: theme === 'classic' ? '#1a1a1a' : color,
          ...(theme === 'modern' ? {
            borderBottom: `2px solid ${color}`,
            paddingBottom: 8,
          } : {}),
        }}>
          {form.title}
        </h1>
      )}

      <div className="form-doc-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

      {(showUserSig || showAdminSig) && (
        <div style={{
          display: 'flex',
          justifyContent: sigJustify,
          gap: 32,
          marginTop: 56,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}>
          {showUserSig && (
            <SigBlock label={form.signatureLabel || 'חתימה'} img={userSignature} />
          )}
          {showAdminSig && (
            <SigBlock label={form.adminSignatureLabel || ''} img={form.adminSignatureUrl} />
          )}
        </div>
      )}
    </div>
  );
}
