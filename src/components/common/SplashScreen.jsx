import { motion } from 'framer-motion';

export default function SplashScreen({ message = 'טוען את הקהילה…' }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-canvas">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative"
      >
        <div className="absolute inset-0 -z-10 rounded-full bg-muted-200 blur-2xl opacity-60 animate-pulse" />
        <motion.img
          src="/havruta-logo-final.png"
          alt="חברותא"
          className="h-24 w-auto drop-shadow-xl"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-6 brand-display text-3xl text-ink"
      >
        חברותא
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-2 text-sm text-ink-400"
      >
        {message}
      </motion.p>

      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-accent"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}
