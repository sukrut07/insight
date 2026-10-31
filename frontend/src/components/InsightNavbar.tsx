import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ActiveTab, SignLanguageId } from '../types';
import { ArrowUpRight, Menu, X, Sparkles } from 'lucide-react';
import { SignLanguageSelector } from './SignLanguageSelector';
import { InsightBrandLogo } from './InsightBrandLogo';


export const InsightNavbar: React.FC = () => {
  const { activeTab, setActiveTab, activeLanguage } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: { id: ActiveTab; label: string; href?: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'gesture-lab', label: 'Gesture Lab' },
    { id: 'workbook', label: 'Workbook' },
    { id: 'connect', label: 'Connect' },
    { id: 'learn', label: 'Learn' },
    { id: 'dictionary', label: 'Dictionary' },
    { id: 'status', label: 'Model Status' },
    { id: 'research', label: 'Research' },
    { id: 'about', label: 'About' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-cream-100/95 backdrop-blur-md border-b-2 border-charcoal shadow-sm py-3'
          : 'bg-cream-100 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick('home')}
          className="cursor-pointer group"
        >
          <InsightBrandLogo size="md" />
        </div>

        {/* Center Desktop Navigation Pills */}
        <nav className="hidden md:flex items-center space-x-1.5 bg-white border-2 border-charcoal rounded-full p-1 shadow-hard-sm">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-charcoal text-cream-100 shadow-sm'
                    : 'text-charcoal hover:bg-cream-200/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden sm:flex items-center space-x-3">
          {/* Active Language Badge */}
          <div className="hidden lg:flex items-center space-x-1 px-3 py-1 bg-white border-2 border-charcoal rounded-full text-xs font-bold shadow-hard-xs">
            <span className="text-sm">
              {activeLanguage === 'ISL' ? '🇮🇳' : activeLanguage === 'BSL' ? '🇬🇧' : '🇺🇸'}
            </span>
            <span>{activeLanguage}</span>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => handleNavClick('gesture-lab')}
            className={`neo-btn px-5 py-2 text-xs text-charcoal ${
              activeTab === 'gesture-lab' ? 'bg-pastel-mint' : 'bg-pastel-lavender'
            }`}
          >
            <span>Open Gesture Lab</span>
            <ArrowUpRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center space-x-2 md:hidden">
          <button
            type="button"
            onClick={() => handleNavClick('gesture-lab')}
            className="neo-btn px-3 py-1.5 text-xs bg-pastel-lavender text-charcoal"
          >
            <span>Lab</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border-2 border-charcoal bg-white rounded-xl shadow-hard-xs"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-charcoal" /> : <Menu className="w-5 h-5 text-charcoal" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 mx-4 p-4 bg-white border-2 border-charcoal rounded-2xl shadow-hard animate-fade-in space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                activeTab === item.id
                  ? 'bg-charcoal text-white border-charcoal'
                  : 'bg-cream-100/60 text-charcoal border-transparent hover:border-charcoal'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t-2 border-charcoal">
            <button
              type="button"
              onClick={() => handleNavClick('gesture-lab')}
              className="w-full neo-btn py-3 bg-pastel-mint text-charcoal text-sm justify-center"
            >
              <span>Launch Gesture Lab Workspace</span>
              <ArrowUpRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
