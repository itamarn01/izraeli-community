import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Briefcase, Users, Gift, ArrowLeft } from 'lucide-react';
import Logo from '../components/common/Logo.jsx';

const features = [
  {
    icon: Gift,
    title: 'מועדון הטבות',
    desc: 'הטבות בלעדיות לחברי החטיבה — מאוכל ופנאי ועד פיננסים וביטוח.',
    color: 'bg-accent-50 text-accent-700',
  },
  {
    icon: Briefcase,
    title: 'לוח דרושים וקריירה',
    desc: 'משרות שמועלות על ידי חברי הקהילה, עם אפשרות הגשה אנונימית.',
    color: 'bg-olive-50 text-olive-700',
  },
  {
    icon: Users,
    title: 'קהילה פעילה',
    desc: 'פיד חברתי שבו תוכלו לשתף, להתייעץ ולהכיר חברים חדשים.',
    color: 'bg-muted-100 text-muted-700',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-ink-100 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost">כניסה</Link>
            <Link to="/join" className="btn-primary">הצטרפות לקהילה</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden min-h-[600px] flex items-center">
        {/* Background Layers */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/chayal-landing.png")' }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-bl from-ink/90 via-ink/60 to-ink/90" />

        <div className="relative z-20 mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-2 gap-10 items-center w-full">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="chip-accent mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              קהילת חטיבת יזרעאלי
            </span>
            <h1 className="brand-display text-4xl md:text-5xl text-white leading-tight drop-shadow-lg">
              הבית הדיגיטלי <br /> של לוחמי החטיבה
            </h1>
            <p className="mt-5 text-white/90 text-lg leading-relaxed max-w-md drop-shadow">
              פלטפורמה אחת שמרכזת הטבות, משרות וקהילה — ייעודית לחברי החטיבה ובני המשפחות.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/join" className="btn-primary">
                התחלת תהליך הצטרפות
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-outline">כבר יש לי חשבון</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-gradient-to-bl from-accent-100/60 to-olive-100/60 rounded-[40px] blur-2xl" />
            <div className="relative card p-8 flex flex-col items-center text-center">
              <img src="/izraeli-logo.png" alt="" className="h-40 w-40 animate-floatY" />
              <h3 className="mt-4 brand-display text-2xl text-ink">חטיבת יזרעאלי</h3>
              <p className="mt-1 text-sm text-ink-400">קהילת הלוחמים</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-ink">מה תמצאו בפלטפורמה</h2>
          <p className="text-ink-400 mt-2">כלי אחד לכל מה שהקהילה צריכה</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-6"
            >
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={32} />
          <p className="text-xs text-ink-400">© קהילת חטיבת יזרעאלי. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}
