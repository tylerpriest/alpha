import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">AlphaIntel</span>
        </Link>

        <div className="space-y-6">
          <blockquote className="text-2xl font-medium leading-relaxed">
            "AlphaIntel has transformed how we preserve institutional knowledge.
            When a senior partner retired, we didn't lose decades of deal wisdom -
            it's all queryable by our new associates."
          </blockquote>
          <div>
            <p className="font-semibold">Sarah Chen</p>
            <p className="text-primary-foreground/70">Managing Partner, Apex Ventures</p>
          </div>
        </div>

        <div className="flex items-center gap-8 text-sm text-primary-foreground/70">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            SOC 2 Type II
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            256-bit Encryption
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            GDPR Compliant
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">AlphaIntel</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
