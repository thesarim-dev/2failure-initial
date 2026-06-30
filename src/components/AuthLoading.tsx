import { FailureLogo } from './FailureLogo';
import { useLanguage } from '../context/LanguageContext';

export function AuthLoading() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen w-full bg-[#f4f4f0] dark:bg-[#1a1a1a] flex flex-col items-center justify-center gap-4">
      <FailureLogo size={40} className="failure-logo animate-pulse" />
      <p className="font-bold uppercase tracking-widest text-sm normal-case">
        {t.auth.loading}
      </p>
    </div>
  );
}
