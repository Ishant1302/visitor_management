import Navbar from './Navbar';

/**
 * PageShell — wraps every authenticated page with the navbar and a
 * consistent clean content area.
 */
export default function PageShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        SUVMS · BML Munjal University Visitor Gate Management System
      </footer>
    </div>
  );
}
