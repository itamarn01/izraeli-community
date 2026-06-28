import { renderFormBody } from '../../utils/formRender.js';

function SigBlock({ label, img }) {
  return (
    <div style={{ flex: '1 1 200px', maxWidth: 260, textAlign: 'center' }}>
      <div
        style={{
          height: 70,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          borderBottom: '1px solid #1a1a1a',
          paddingBottom: 4,
        }}
      >
        {img ? (
          <img src={img} alt="חתימה" crossOrigin="anonymous" style={{ maxHeight: 66, maxWidth: '100%', objectFit: 'contain' }} />
        ) : null}
      </div>
      {label ? <div style={{ marginTop: 6, fontSize: 13, color: '#444' }}>{label}</div> : null}
    </div>
  );
}

// Renders a form as a printable A4-styled document.
// `mode`: 'fill' (blanks for empty) or 'template' (labeled chips for empty).
export default function FormDocument({ form, values = {}, userSignature = '', mode = 'fill', innerRef }) {
  const bodyHtml = renderFormBody(form.bodyHtml, form.fields, values, mode);
  const showUserSig = !!form.requireUserSignature;
  const showAdminSig = !!form.adminSignatureUrl;

  return (
    <div
      ref={innerRef}
      dir="rtl"
      style={{
        background: '#ffffff',
        color: '#1a1a1a',
        padding: '36px 40px',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
        fontSize: 15,
        lineHeight: 1.8,
        boxSizing: 'border-box',
      }}
    >
      {form.title ? (
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 20px', textAlign: 'center' }}>{form.title}</h1>
      ) : null}

      <div className="form-doc-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

      {(showUserSig || showAdminSig) && (
        <div style={{ display: 'flex', justifyContent: showUserSig && showAdminSig ? 'space-between' : 'flex-start', gap: 32, marginTop: 56, flexWrap: 'wrap' }}>
          {showUserSig ? <SigBlock label={form.signatureLabel || 'חתימה'} img={userSignature} /> : null}
          {showAdminSig ? <SigBlock label={form.adminSignatureLabel || ''} img={form.adminSignatureUrl} /> : null}
        </div>
      )}
    </div>
  );
}
