import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Spotly Merchant',
  description: 'Manage your Spotly queues dynamically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-sans`}>
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
