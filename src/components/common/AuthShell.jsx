import { motion } from 'framer-motion';
import Logo from './Logo.jsx';

export default function AuthShell({ title, subtitle, step, totalSteps, children }) {
  return (
    <div className="min-h-screen flex bg-canvas">
      <div className="hidden lg:flex flex-col justify-between w-2/5 text-white p-10 relative overflow-hidden">
        {/* Background Image and Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center" 
          style={{ backgroundImage: 'url("/chayal.png")' }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-ink/95 via-ink/50 to-ink/70" />
        
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl z-10" />
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-olive/10 blur-3xl z-10" />

        <div className="relative z-20">
          <Logo size={48} variant="light" />
        </div>

        <div className="relative z-20 max-w-sm">
          <h2 className="brand-display text-3xl leading-tight">
            ״קוֹל קָרָא, וְהָלַכְתִּי״
          </h2>
          <p className="mt-3 text-sm text-ink-100 leading-relaxed font-medium">
            הצטרפו לקהילה הדיגיטלית של לוחמי חטיבת יזרעאלי — הטבות, משרות וחברים, במקום אחד.
          </p>
        </div>

        <div className="relative z-20 text-xs text-ink-200">
          © כל הזכויות שמורות לקהילת חטיבת יזרעאלי
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-6 flex justify-center">
            <Logo />
          </div>

          {step !== undefined && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 text-xs text-ink-400">
                <span>שלב {step} מתוך {totalSteps}</span>
                <span>{Math.round((step / totalSteps) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / totalSteps) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          <div className="card p-7">
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
