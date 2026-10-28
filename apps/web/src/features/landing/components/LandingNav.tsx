import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Menu, X, ArrowRight } from 'lucide-react';
import { BrandMark } from './BrandMark';

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Workspace preview', href: '#product-preview' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Action Firewall', href: '#action-firewall' },
    { label: 'Governance', href: '#governance' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs'
          : 'bg-white border-b border-slate-100'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Brand Link */}
        <a
          href="#top"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-0.5"
          aria-label="CaseBridge home"
        >
          <BrandMark variant="dark" size="sm" />
        </a>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-8"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-700 hover:text-blue-700 px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
          >
            Officer Sign In
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-white border-t border-slate-200 p-6 md:hidden overflow-y-auto">
          <nav aria-label="Mobile navigation" className="space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-800 py-2 border-b border-slate-100"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 space-y-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Officer Sign In
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 bg-blue-700 text-sm font-medium rounded-lg text-white hover:bg-blue-800 shadow-xs"
              >
                Open Investigation Workspace
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
