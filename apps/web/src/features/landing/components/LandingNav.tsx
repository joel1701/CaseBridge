import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Menu, X, ArrowRight, ExternalLink } from 'lucide-react';
import { BrandMark } from './BrandMark';

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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

  // Prevent body scroll when mobile menu is open
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
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'For Caseworkers', href: '#audiences' },
    { label: 'About', href: '#problem-solution' },
    { label: 'Trust & Privacy', href: '#trust' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-[#FFFCF0]/95 backdrop-blur-md border-b border-[#E8E6DF] shadow-xs'
          : 'bg-[#FFFCF0] border-b border-[#F0EFEA]'
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-12">
        {/* Brand Link */}
        <a
          href="#top"
          className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] rounded-md"
        >
          <BrandMark variant="dark" size="md" />
        </a>

        {/* Desktop Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-8"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#4A4A46] hover:text-[#171717] transition-colors relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] rounded-sm group"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#171717] transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium text-[#171717] hover:text-[#525250] px-3.5 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]"
          >
            Officer Sign In
          </Link>
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 rounded-md bg-[#171717] px-4.5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#2b2b2b] active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#171717]"
          >
            <span>Try CaseBridge</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/dashboard"
            className="text-xs font-semibold bg-[#171717] text-white px-3 py-1.5 rounded-md"
          >
            Try App
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={
              mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            className="p-2 rounded-md text-[#171717] hover:bg-[#F3F3F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="fixed inset-0 top-18 z-40 bg-[#171717]/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-[#FFFCF0] border-b border-[#E8E6DF] px-6 py-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-[#171717] hover:bg-[#F3F3F1] px-3 py-2.5 rounded-md transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="my-2 border-t border-[#E8E6DF]" />
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-base font-medium text-[#171717] px-3 py-2.5 rounded-md hover:bg-[#F3F3F1]"
              >
                <span>Officer Sign In</span>
                <span className="text-xs text-[#71716D]">
                  Internal Portal →
                </span>
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#2b2b2b]"
              >
                <span>Try CaseBridge</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
