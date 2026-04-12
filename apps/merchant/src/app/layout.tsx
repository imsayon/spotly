import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { LayoutWrapper } from '@/components/LayoutWrapper';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Spotly Merchant',
  description: 'Manage your Spotly queues dynamically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-sans`}>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
