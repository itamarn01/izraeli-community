export default function Logo({ size = 40, variant = 'default' }) {
  const logoSrc = variant === 'light' ? '/havruta-logo-final-white.png' : '/havruta-logo-final.png';
  
  return (
    <div className="flex items-center">
      <img 
        src={logoSrc}
        alt="חברותא" 
        style={{ height: size, width: 'auto' }} 
      />
    </div>
  );
}
