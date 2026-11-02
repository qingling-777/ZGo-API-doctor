import { useCallback, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { AuroraBackground } from './components/AuroraBackground';
import { ParticleBackground } from './components/ParticleBackground';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { TechDetails } from './components/TechDetails';
import { KeyZeroTrust } from './components/KeyZeroTrust';
import { Footer } from './components/Footer';
import { PageTransition } from './components/PageTransition';
import { DetectPage } from './pages/DetectPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AboutPage } from './pages/AboutPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { IntegrationPage } from './pages/IntegrationPage';
import { ShareReport, ShareReportEmpty } from './components/ShareReport';
import { useRouter, readShareToken } from './router';
import { decodeShareToken } from './lib/share';
import { I18nProvider, useI18n } from './lib/i18n';
import { applyDocumentMeta } from './lib/meta';
import type { DetectionReport } from './types';
import { ArrowRight } from 'lucide-react';

function HomePage() {
  const { navigate } = useRouter();
  const { t } = useI18n();

  const handleStartClick = useCallback(() => {
    navigate('detect');
  }, [navigate]);

  return (
    <main>
      <Hero onStartClick={handleStartClick} />
      <Features />
      <HowItWorks />
      <TechDetails />
      <KeyZeroTrust />
      <section className="relative py-20 lg:py-28" style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <button onClick={handleStartClick} className="btn-primary group text-base px-10 py-4">
            <span>{t('开始检测', 'Run a check')}</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-5 text-ink-300 text-sm">
            {t(
              '进入检测页，选择协议规则（OpenAI / Anthropic / Gemini / Mistral / Cohere），填入接口地址与 API Key 即可开始。',
              'Open the check page, pick a protocol (OpenAI / Anthropic / Gemini / Mistral / Cohere), then enter your Base URL and API key.',
            )}
          </p>
        </div>
      </section>
    </main>
  );
}

function ShareReportRoute() {
  const token = readShareToken(window.location.hash);
  const [report] = useState<DetectionReport | null>(() => (token ? decodeShareToken(token) : null));
  return report ? <ShareReport report={report} /> : <ShareReportEmpty />;
}

function AppShell() {
  const { route, navigate } = useRouter();
  const { lang } = useI18n();

  // 标签页标题与描述跟着语言走（index.html 里那份是英文静态兜底）
  useEffect(() => {
    applyDocumentMeta(lang);
  }, [lang]);

  const renderPage = () => {
    switch (route) {
      case 'detect':
        return <DetectPage />;
      case 'privacy':
        return <PrivacyPage />;
      case 'terms':
        return <TermsPage />;
      case 'about':
        return <AboutPage />;
      case 'changelog':
        return <ChangelogPage />;
      case 'integration':
        return <IntegrationPage />;
      case 'report':
        return <ShareReportRoute />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 relative">
      <AuroraBackground />
      <ParticleBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar currentRoute={route} onNavigate={navigate} />
        <PageTransition routeKey={route}>
          {renderPage()}
        </PageTransition>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  );
}

export default App;
