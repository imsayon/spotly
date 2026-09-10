import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata = {
  title: 'Spotly Merchant',
  description: 'Manage your Spotly queues dynamically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `(()=>{const m=localStorage.getItem('spotly-theme');const d=m==='dark'||(m!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'})()` }} /></head>
      <body className={`${montserrat.variable} ${inter.variable} spotly-app`}>
        <ErrorBoundary>
          <AuthProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
