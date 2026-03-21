import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield, Scale, Lock, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermsOfServicePage() {
  const { t } = useTranslation('terms');
  const navigate = useNavigate();

  const lastUpdateDate = new Date('2026-03-21').toLocaleDateString(
    navigator.language,
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.07),transparent)]" />

      {/* Back Button - Top Left */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all duration-200 z-10 backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">{t("common.back", { ns: "translation" })}</span>
      </button>

      {/* Main Content Container - Centered */}
      <div className="relative z-10 w-full max-w-5xl h-[85vh] mx-auto px-6">

        {/* Header Section - Fixed */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/10 rounded-2xl mb-4">
            <Scale className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('terms.title')}
          </h1>
          <p className="text-sm text-neutral-400">
            {t('terms.lastUpdate', { date: lastUpdateDate })}
          </p>
        </div>

        {/* Scrollable Card - Main Content */}
        <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-2xl shadow-2xl h-[calc(100%-180px)] overflow-y-auto custom-scrollbar">
          <div className="p-8 md:p-12 space-y-10">

          {/* Introduction */}
          <Section icon={FileText} title={t('terms.sections.introduction.title')}>
            <p className="text-neutral-300 leading-relaxed">
              {t('terms.sections.introduction.content')}
            </p>
          </Section>

          {/* Definitions */}
          <Section icon={FileText} title={t('terms.sections.definitions.title')}>
            <div className="space-y-4">
              {(['platform', 'user', 'team', 'content'] as const).map((key) => (
                <div key={key} className="pl-4 border-l-2 border-neutral-700">
                  <p className="text-neutral-300 leading-relaxed">
                    {t(`terms.sections.definitions.${key}`)}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Services */}
          <Section icon={Shield} title={t('terms.sections.services.title')}>
            <p className="text-neutral-300 leading-relaxed mb-4">
              {t('terms.sections.services.intro')}
            </p>
            <ul className="space-y-2">
              {(['management', 'agenda', 'scrims', 'stratbook', 'stats'] as const).map((key) => (
                <li key={key} className="flex items-start gap-3 text-neutral-300">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span>{t(`terms.sections.services.features.${key}`)}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Account */}
          <Section icon={FileText} title={t('terms.sections.account.title')}>
            {(['registration', 'obligations', 'termination'] as const).map((key) => (
              <SubSection key={key} title={t(`terms.sections.account.${key}.title`)}>
                <p className="text-neutral-300 leading-relaxed">
                  {t(`terms.sections.account.${key}.content`)}
                </p>
              </SubSection>
            ))}
          </Section>

          {/* Usage */}
          <Section icon={AlertCircle} title={t('terms.sections.usage.title')}>
            <SubSection title={t('terms.sections.usage.acceptable.title')}>
              <p className="text-neutral-300 leading-relaxed">
                {t('terms.sections.usage.acceptable.content')}
              </p>
            </SubSection>

            <SubSection title={t('terms.sections.usage.prohibited.title')}>
              <p className="text-neutral-300 leading-relaxed mb-3">
                {t('terms.sections.usage.prohibited.intro')}
              </p>
              <ul className="space-y-2">
                {(['harassment', 'spam', 'malware', 'impersonation', 'cheating', 'illegal'] as const).map((key) => (
                  <li key={key} className="flex items-start gap-3 text-neutral-300">
                    <span className="text-red-400 mt-1">•</span>
                    <span>{t(`terms.sections.usage.prohibited.items.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </SubSection>
          </Section>

          {/* Content */}
          <Section icon={FileText} title={t('terms.sections.content.title')}>
            {(['ownership', 'responsibility'] as const).map((key) => (
              <SubSection key={key} title={t(`terms.sections.content.${key}.title`)}>
                <p className="text-neutral-300 leading-relaxed">
                  {t(`terms.sections.content.${key}.content`)}
                </p>
              </SubSection>
            ))}
          </Section>

          {/* Teams */}
          <Section icon={Shield} title={t('terms.sections.teams.title')}>
            {(['roles', 'ownership'] as const).map((key) => (
              <SubSection key={key} title={t(`terms.sections.teams.${key}.title`)}>
                <p className="text-neutral-300 leading-relaxed">
                  {t(`terms.sections.teams.${key}.content`)}
                </p>
              </SubSection>
            ))}
          </Section>

          {/* Data */}
          <Section icon={Lock} title={t('terms.sections.data.title')}>
            {(['collection', 'usage', 'security'] as const).map((key) => (
              <SubSection key={key} title={t(`terms.sections.data.${key}.title`)}>
                <p className="text-neutral-300 leading-relaxed">
                  {t(`terms.sections.data.${key}.content`)}
                </p>
              </SubSection>
            ))}
          </Section>

          {/* Intellectual Property */}
          <Section icon={Shield} title={t('terms.sections.intellectual.title')}>
            {(['platform', 'thirdParty'] as const).map((key) => (
              <SubSection key={key} title={t(`terms.sections.intellectual.${key}.title`)}>
                <p className="text-neutral-300 leading-relaxed">
                  {t(`terms.sections.intellectual.${key}.content`)}
                </p>
              </SubSection>
            ))}
          </Section>

          {/* Liability */}
          <Section icon={AlertCircle} title={t('terms.sections.liability.title')}>
            {(['service', 'damages'] as const).map((key) => (
              <SubSection key={key} title={t(`terms.sections.liability.${key}.title`)}>
                <p className="text-neutral-300 leading-relaxed">
                  {t(`terms.sections.liability.${key}.content`)}
                </p>
              </SubSection>
            ))}
          </Section>

          {/* Simple sections */}
          {(['modifications', 'termination', 'law', 'contact'] as const).map((key) => (
            <Section key={key} icon={FileText} title={t(`terms.sections.${key}.title`)}>
              <p className="text-neutral-300 leading-relaxed">
                {t(`terms.sections.${key}.content`)}
              </p>
            </Section>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Section Component
function Section({
  icon: Icon,
  title,
  children
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">
          {title}
        </h2>
      </div>
      <div className="pl-11 space-y-4">
        {children}
      </div>
    </section>
  );
}

// SubSection Component
function SubSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium text-neutral-200">
        {title}
      </h3>
      <div className="pl-4">
        {children}
      </div>
    </div>
  );
}



