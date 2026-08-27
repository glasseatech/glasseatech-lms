import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck, User, Sparkles, HelpCircle, ArrowRight, Check } from 'lucide-react';
import { signInWithGoogle } from '../firebase.ts';

interface AuthModalProps {
  onAuthComplete: (userEmail: string, role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN', userName?: string) => void;
  onClose: () => void;
  adminOnly?: boolean;
}

export default function AuthModal({
  onAuthComplete,
  onClose,
  adminOnly
}: AuthModalProps) {
  const [authView, setAuthView] = useState<'signin' | 'signup' | 'forgot' | 'verify'>('signin');
  
  // Fields state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'INSTRUCTOR' | 'ADMIN'>(adminOnly ? 'ADMIN' : 'STUDENT');

  // Success/Error logs
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // In our full-stack simulation, logging in as specific emails sets roles automatically!
    let targetRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' = selectedRole;
    if (email.includes('mercer@') || email.includes('admin@')) {
      targetRole = 'ADMIN';
    } else if (email.includes('carter@') || email.includes('inst@')) {
      targetRole = 'INSTRUCTOR';
    }

    onAuthComplete(email, targetRole);
  };

  const handleGoogleSignIn = async () => {
    try {
      setAlertError('');
      const user = await signInWithGoogle();
      if (user && user.email) {
        let targetRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' = selectedRole;
        if (user.email.includes('admin') || user.email.includes('mercer')) {
          targetRole = 'ADMIN';
        } else if (user.email.includes('inst') || user.email.includes('carter')) {
          targetRole = 'INSTRUCTOR';
        }
        onAuthComplete(user.email, targetRole, user.displayName || undefined);
      }
    } catch (error) {
      console.error('Google Sign In failed', error);
      setAlertError('Google Sign In failed. Please try again.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSuccess('Scholar registration received. Dispatched cryptographically signed verification code.');
    setTimeout(() => {
      setAuthView('verify');
    }, 2000);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSuccess('Reset guidelines dispatched to Secure Log Ledger mail directories.');
    setTimeout(() => {
      setAlertSuccess('');
      setAuthView('signin');
    }, 2500);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthComplete(email, selectedRole, fullName);
  };

  return (
    <div className="fixed inset-0 bg-secondary-dark/95 z-50 flex items-center justify-center p-4 overflow-y-auto" id="auth-portal-barrier">
      
      <div className="w-full max-w-md bg-secondary-dark border border-primary/30 rounded-3xl p-8 text-center bg-neutral-bg glow-neon-cyan relative overflow-hidden" id="auth-terminal-casing">
        {/* Glow decoration */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-primary/10 rounded-full blur-xl -z-10"></div>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest font-bold">Secure Access Gateway</span>
            <button 
              onClick={onClose} 
              className="text-neutral-medium hover:text-neutral-dark text-[11px] font-mono uppercase tracking-wider cursor-pointer"
            >
              Skip
            </button>
          </div>

          {/* ================= VIEW 1: SIGN IN ================= */}
          {authView === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-5 text-left" id="auth-signin-form">
              <div className="space-y-1 text-center">
                <span className="text-xs uppercase tracking-widest text-[#00D9FF] font-mono font-bold">LUMINARY ACADEMY NEXUS</span>
                <h3 className="text-xl font-display font-extrabold text-white">Enter secure capsule channel</h3>
              </div>
              
              <div className="pt-2 pb-1">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 bg-neutral-light dark:bg-neutral-light text-gray-900 dark:text-neutral-dark font-display font-bold text-xs rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-medium/10 transition flex items-center justify-center gap-2 cursor-pointer border border-gray-200 dark:border-white/10"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign In with Google
                </button>
              </div>

              {alertError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs text-center font-mono animate-fade-in">
                  {alertError}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-mono">
                  <span className="bg-neutral-bg px-2 text-neutral-medium uppercase tracking-wider">Or continue with email</span>
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-medium uppercase font-bold">Portal Gateway Mode</label>
                  <div className={`grid ${adminOnly ? 'grid-cols-1' : 'grid-cols-2'} gap-2 bg-secondary-dark/60 p-1 rounded-xl border border-white/10`}>
                    {!adminOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('STUDENT')}
                          className={`py-1.5 text-center text-[10px] font-bold font-mono uppercase rounded-lg transition-all cursor-pointer ${
                            selectedRole === 'STUDENT'
                              ? 'bg-gradient-to-r from-primary via-primary-light to-accent text-black shadow'
                              : 'text-neutral-medium hover:text-white bg-transparent border-none'
                          }`}
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('INSTRUCTOR')}
                          className={`py-1.5 text-center text-[10px] font-bold font-mono uppercase rounded-lg transition-all cursor-pointer ${
                            selectedRole === 'INSTRUCTOR'
                              ? 'bg-gradient-to-r from-primary via-primary-light to-accent text-black shadow'
                              : 'text-neutral-medium hover:text-white bg-transparent border-none'
                          }`}
                        >
                          Instructor
                        </button>
                      </>
                    )}
                    {adminOnly && (
                      <button
                        type="button"
                        onClick={() => setSelectedRole('ADMIN')}
                        className={`py-1.5 text-center text-[10px] font-bold font-mono uppercase rounded-lg transition-all cursor-pointer ${
                          selectedRole === 'ADMIN'
                            ? 'bg-gradient-to-r from-primary via-primary-light to-accent text-black shadow'
                            : 'text-neutral-medium hover:text-white bg-transparent border-none'
                        }`}
                      >
                        Admin
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-medium uppercase font-bold">Ledger Email Account</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full bg-secondary-dark/60 border border-white/10 rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:border-primary"
                      required
                    />
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-medium" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-neutral-medium uppercase font-bold">Access Password Key</label>
                    <button 
                      type="button"
                      onClick={() => setAuthView('forgot')}
                      className="text-[9px] text-primary hover:underline hover:text-primary-light"
                    >
                      Reset password?
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-secondary-dark/60 border border-white/10 rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:border-primary"
                      required
                    />
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-medium" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-3 text-mono">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-primary via-primary-light to-accent text-black font-display font-bold text-xs rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  Authorize Profile
                  <ArrowRight className="h-4 w-4" />
                </button>
                
                <span className="block text-center text-xs text-neutral-medium">
                  New scholar applicant?{' '}
                  <button 
                    type="button"
                    onClick={() => setAuthView('signup')} 
                    className="text-primary font-bold hover:underline"
                  >
                    Register custom account
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* ================= VIEW 2: SIGN UP ================= */}
          {authView === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-5 text-left" id="auth-signup-form">
              <div className="space-y-1 text-center">
                <span className="text-xs uppercase tracking-widest text-primary font-mono font-bold">NEXUS ADMISSIONS</span>
                <h3 className="text-xl font-display font-bold text-white">Enroll secure digital pass</h3>
              </div>
              
              <div className="pt-2 pb-1">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 bg-neutral-light dark:bg-neutral-light text-gray-900 dark:text-neutral-dark font-display font-bold text-xs rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-medium/10 transition flex items-center justify-center gap-2 cursor-pointer border border-gray-200 dark:border-white/10"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign Up with Google
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-mono">
                  <span className="bg-neutral-bg px-2 text-neutral-medium uppercase tracking-wider">Or continue with email</span>
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-medium uppercase font-bold">Portal Enrollment Mode</label>
                  <div className={`grid ${adminOnly ? 'grid-cols-1' : 'grid-cols-2'} gap-2 bg-secondary-dark/60 p-1 rounded-xl border border-white/10`}>
                    {!adminOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('STUDENT')}
                          className={`py-1.5 text-center text-[10px] font-bold font-mono uppercase rounded-lg transition-all cursor-pointer ${
                            selectedRole === 'STUDENT'
                              ? 'bg-gradient-to-r from-primary via-primary-light to-accent text-black shadow'
                              : 'text-neutral-medium hover:text-white bg-transparent border-none'
                          }`}
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('INSTRUCTOR')}
                          className={`py-1.5 text-center text-[10px] font-bold font-mono uppercase rounded-lg transition-all cursor-pointer ${
                            selectedRole === 'INSTRUCTOR'
                              ? 'bg-gradient-to-r from-primary via-primary-light to-accent text-black shadow'
                              : 'text-neutral-medium hover:text-white bg-transparent border-none'
                          }`}
                        >
                          Instructor
                        </button>
                      </>
                    )}
                    {adminOnly && (
                      <button
                        type="button"
                        onClick={() => setSelectedRole('ADMIN')}
                        className={`py-1.5 text-center text-[10px] font-bold font-mono uppercase rounded-lg transition-all cursor-pointer ${
                          selectedRole === 'ADMIN'
                            ? 'bg-gradient-to-r from-primary via-primary-light to-accent text-black shadow'
                            : 'text-neutral-medium hover:text-white bg-transparent border-none'
                        }`}
                      >
                        Admin
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-medium uppercase font-bold">
                    {selectedRole === 'INSTRUCTOR' ? 'Instructor Full Name' : 'Scholar Full Name'}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-secondary-dark/60 border border-white/10 rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:border-primary"
                      required
                    />
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-medium" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-medium uppercase font-bold">
                    {selectedRole === 'INSTRUCTOR' ? 'Instructor Email Address' : 'Admission Email Address'}
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-secondary-dark/60 border border-white/10 rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:border-primary"
                      required
                    />
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-medium" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-primary via-primary-light to-accent text-black font-display font-bold text-xs rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  Generate Admission Code
                </button>
                
                {alertSuccess && (
                  <div className="p-2.5 bg-accent-alt/15 border border-accent-alt/30 rounded-lg text-accent-alt text-[10px] font-mono">
                    {alertSuccess}
                  </div>
                )}

                <span className="block text-center text-xs text-neutral-medium">
                  Registered with a pass?{' '}
                  <button 
                    type="button"
                    onClick={() => setAuthView('signin')} 
                    className="text-primary font-bold hover:underline"
                  >
                    Secure Sign In
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* ================= VIEW 3: FORGOT PASSWORD ================= */}
          {authView === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-5 text-left" id="auth-forgot-form">
              <div className="space-y-1 text-center">
                <span className="text-xs uppercase tracking-widest text-[#FF00AA] font-mono font-bold">SECURITY DISPATCH</span>
                <h3 className="text-xl font-display font-bold text-white">Reset authorization variables</h3>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-medium uppercase font-bold">Registered email address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-secondary-dark/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-accent text-neutral-dark font-display font-bold text-xs rounded-xl hover:bg-accent-light transition cursor-pointer"
                >
                  Dispatch Security Reset
                </button>

                {alertSuccess && (
                  <div className="p-2.5 bg-accent-alt/15 border border-accent-alt/30 rounded-lg text-accent-alt text-[10px] font-mono flex items-center gap-1">
                    <Check className="h-4 w-4 shrink-0" />
                    {alertSuccess}
                  </div>
                )}

                <button 
                  type="button"
                  onClick={() => setAuthView('signin')} 
                  className="w-full text-center text-xs text-primary font-bold hover:underline mt-2"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ================= VIEW 4: CODE VERIFICATION ================= */}
          {authView === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-5 text-left" id="auth-verify-form">
              <div className="space-y-1 text-center">
                <ShieldCheck className="h-10 w-10 text-accent-alt mx-auto animate-bounce" />
                <h3 className="text-xl font-display font-bold text-white">Credential check</h3>
                <p className="text-xs text-neutral-medium">Enter the 6-digit access token dispatched to your inbox ledger.</p>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-medium uppercase font-bold text-center block">6-DIGIT VERIFICATION TOKEN</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-full bg-secondary-dark/60 border border-white/20 rounded-xl p-3 text-lg font-bold text-center tracking-widest text-[#00FF9F] focus:outline-none focus:border-accent-alt"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-primary via-primary-light to-accent text-black font-display font-bold text-xs rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  Unlock Academic Sandbox
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
