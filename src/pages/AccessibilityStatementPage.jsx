import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Mail } from 'lucide-react';

const FEATURES = [
  'האתר מוגדר בכיוון ימין-לשמאל (RTL) בהתאם לשפה העברית',
  'האתר תומך בניווט מלא באמצעות מקלדת',
  'האתר תומך בקוראי מסך (NVDA, JAWS, VoiceOver, TalkBack)',
  'ניגודיות צבעים עומדת ביחס 4.5:1 לפחות לטקסט רגיל',
  'תמונות מלוות בטקסט חלופי מתאים',
  'טפסים מכילים תוויות מזהות לכל שדה קלט',
  'הודעות שגיאה מנוסחות בעברית ברורה ומקושרות לשדה הרלוונטי',
  'ישנה קישורית "דלג לתוכן הראשי" לדילוג על ניווט חוזר',
  'ניתן לשנות גודל טקסט, ניגודיות, רווח שורות וגופן דרך תפריט הנגישות',
  'ניתן להפחית אנימציות ואפקטי מעבר דרך תפריט הנגישות',
  'תפריט הנגישות נגיש מכל מקום בדף באמצעות קיצור המקלדת Alt+A',
];

export default function AccessibilityStatementPage() {
  return (
    <div className="min-h-screen bg-canvas" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink mb-8">
          <ArrowRight className="h-4 w-4" />
          חזרה לדף הבית
        </Link>

        <h1 className="text-3xl font-bold text-ink mb-1">הצהרת נגישות</h1>
        <p className="text-sm text-ink-400 mb-8">עדכון אחרון: מאי 2025</p>

        <p className="text-sm text-ink-600 mb-8 leading-relaxed">
          אפליקציית "חברותא" מחויבת להנגשת שירותיה לאנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות (התשנ"ח-1998) ותקנות הנגישות לשירות (תשע"ג-2013), תקן IS 5568:2020, ועל פי הנחיות WCAG 2.1 ברמה AA.
        </p>

        <section className="mb-8">
          <h2 className="text-base font-bold text-ink mb-3">רמת הנגישות</h2>
          <p className="text-sm text-ink-600 leading-relaxed">
            האתר עומד ברמת נגישות AA בהתאם לתקן הישראלי IS 5568:2020, המבוסס על WCAG 2.1 AA.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-ink mb-4">אמצעי הנגישות באתר</h2>
          <ul className="space-y-2">
            {FEATURES.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-600 leading-relaxed">
                <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-ink mb-3">מגבלות נגישות ידועות</h2>
          <p className="text-sm text-ink-600 leading-relaxed">
            אנו עובדים באופן מתמיד על שיפור הנגישות. ייתכן שחלק מהתכנים הישנים טרם הוסבו לפורמט נגיש במלואו. תוכן שמועלה על-ידי משתמשים (פוסטים, קורות חיים) נמצא באחריות המשתמשים ואינו בשליטתנו המלאה.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-ink mb-4">פנייה בנושא נגישות</h2>
          <p className="text-sm text-ink-600 leading-relaxed mb-4">
            אם נתקלתם בבעיית נגישות באתר או זקוקים לסיוע בגישה לתוכן, אנא פנו לרכז/ת הנגישות שלנו:
          </p>
          <div className="bg-ink-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-3 text-sm text-ink-600">
              <Mail className="h-4 w-4 text-accent shrink-0" aria-hidden />
              <span>
                דואר אלקטרוני:{' '}
                <a href="mailto:negishot@havruta.co.il" className="text-accent hover:underline" dir="ltr">
                  negishot@havruta.co.il
                </a>
              </span>
            </div>
          </div>
          <p className="text-xs text-ink-400 mt-3">
            אנו מתחייבים להשיב על פניות בנושא נגישות תוך 7 ימי עבודה.
          </p>
        </section>

        <div className="mt-10 pt-6 border-t border-ink-100 text-sm text-ink-400">
          ראה גם:{' '}
          <Link to="/terms" className="text-accent hover:underline">תנאי שימוש</Link>
          {' '}|{' '}
          <Link to="/privacy" className="text-accent hover:underline">מדיניות פרטיות</Link>
        </div>
      </div>
    </div>
  );
}
