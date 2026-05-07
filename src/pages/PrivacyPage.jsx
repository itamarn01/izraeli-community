import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PRIVACY_SECTIONS } from '../content/legal.js';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink mb-8">
          <ArrowRight className="h-4 w-4" />
          חזרה לדף הבית
        </Link>

        <h1 className="text-3xl font-bold text-ink mb-1">מדיניות פרטיות</h1>
        <p className="text-sm text-ink-400 mb-8">עדכון אחרון: מאי 2025</p>

        <p className="text-sm text-ink-600 mb-8 leading-relaxed">
          אפליקציית "חברותא" מתחייבת להגן על הפרטיות שלכם. מדיניות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלכם.
        </p>

        <div className="space-y-7">
          {PRIVACY_SECTIONS.map((section) => (
            <div key={section.num}>
              <h2 className="text-base font-bold text-ink mb-3">
                {section.num}. {section.title}
              </h2>
              <ul className="space-y-2">
                {section.points.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-600 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-ink-100 text-sm text-ink-400">
          ראה גם:{' '}
          <Link to="/terms" className="text-accent hover:underline">
            תנאי שימוש
          </Link>
        </div>
      </div>
    </div>
  );
}
