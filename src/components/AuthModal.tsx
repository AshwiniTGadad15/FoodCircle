import React, { useState } from 'react';
import { CheckCircle2, KeyRound, Mail, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiRequest, INDIAN_CITIES } from '../lib/api.ts';
import type { PublicUser } from '../../shared/types.ts';

const REGISTRATION_ROLES = [
  { id: 'donor', label: 'Food Donor', desc: 'Share surplus meals from home or events' },
  { id: 'seeker', label: 'Food Seeker', desc: 'Find and request safe surplus food nearby' },
  { id: 'volunteer', label: 'Volunteer', desc: 'Deliver rescued meals across neighborhoods' },
  { id: 'ngo', label: 'NGO / Organization', desc: 'Coordinate bulk food recovery & distribution' },
  { id: 'business', label: 'Restaurant / Business', desc: 'List kitchen, hotel, bakery, or grocery surplus' },
] as const;

export function AuthModal() {
  const {
    authModal,
    openAuthModal,
    closeAuthModal,
    onAuthSuccess,
    verificationCodeHint,
    setVerificationCodeHint,
    serverConfig,
    user,
    setUser,
    showToast,
    navigate,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [role, setRole] = useState<(typeof REGISTRATION_ROLES)[number]['id']>('donor');

  // Verify email
  const [verifyCode, setVerifyCode] = useState('');

  // Forgot / Reset password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStage, setResetStage] = useState<'request' | 'confirm'>('request');
  const [resetCodeHint, setResetCodeHint] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Admin first-run claim
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  if (!authModal) return null;

  const switchMode = (mode: typeof authModal) => {
    setError(null);
    openAuthModal(mode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: PublicUser }>('/auth/login', {
        method: 'POST',
        body: { email: loginEmail, password: loginPassword },
      });
      onAuthSuccess(res.token, res.user, null);
      showToast(`Welcome back, ${res.user.fullName}.`);
      navigate(res.user.role === 'admin' ? 'admin' : 'dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest<{
        token: string;
        user: PublicUser;
        verificationCodePreview?: string;
      }>('/auth/register', {
        method: 'POST',
        body: {
          fullName,
          email: regEmail,
          phone,
          password: regPassword,
          city,
          role,
        },
      });
      onAuthSuccess(res.token, res.user, res.verificationCodePreview || null);
      showToast('Account created! Complete email verification to finish onboarding.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ user: PublicUser }>('/auth/verify-email', {
        method: 'POST',
        body: { code: verifyCode },
      });
      setUser(res.user);
      setVerificationCodeHint(null);
      closeAuthModal();
      showToast('Email verified! Your FoodCircle dashboard is ready.');
      navigate('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    try {
      const res = await apiRequest<{ verificationCodePreview?: string }>('/auth/resend-verification', {
        method: 'POST',
      });
      if (res.verificationCodePreview) {
        setVerificationCodeHint(res.verificationCodePreview);
      }
      showToast('A fresh verification code was generated.', 'info');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ message: string; resetCodePreview?: string }>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: { email: forgotEmail },
        },
      );
      setResetCodeHint(res.resetCodePreview || null);
      setResetStage('confirm');
      showToast(res.message, 'info');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: {
          email: forgotEmail,
          code: resetCode,
          newPassword,
        },
      });
      showToast('Password updated! Please sign in with your new password.');
      setResetStage('request');
      setResetCode('');
      setNewPassword('');
      setLoginEmail(forgotEmail);
      switchMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: PublicUser }>('/auth/admin-claim', {
        method: 'POST',
        body: {
          fullName: adminName,
          email: adminEmail,
          password: adminPassword,
          city: 'Bengaluru',
        },
      });
      onAuthSuccess(res.token, res.user, null);
      showToast('Admin account initialized. Welcome to the FoodCircle Admin Console.');
      navigate('admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin setup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#202820]/50 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="FoodCircle Authentication"
    >
      <div className="bg-white rounded-2xl border border-[#E2E8E0] shadow-xl w-full max-w-lg my-auto overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E2E8E0] flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[#202820]">
              {authModal === 'login' && 'Sign in to FoodCircle'}
              {authModal === 'register' && 'Join the FoodCircle Network'}
              {authModal === 'verify' && 'Verify your email address'}
              {authModal === 'forgot' && 'Reset your password'}
              {authModal === 'admin-claim' && 'Initialize Admin Account'}
            </h2>
            <p className="text-xs text-[#526054] mt-0.5">
              {authModal === 'login' && 'Access your role dashboard, donations, and requests.'}
              {authModal === 'register' && 'Choose how you want to share, volunteer, or receive surplus food.'}
              {authModal === 'verify' && `Confirm ownership of ${user?.email || 'your account'}.`}
              {authModal === 'forgot' && 'Securely recover access to your account.'}
              {authModal === 'admin-claim' && 'One-time setup to claim platform moderation controls.'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close modal"
            className="p-2 rounded-lg text-[#526054] hover:bg-[#F8FAF7] hover:text-[#202820]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* LOGIN VIEW */}
          {authModal === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-[#202820]">Password</label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-medium text-[#16834A] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {!serverConfig.googleAuthConfigured && (
                <p className="text-xs text-[#526054] text-center pt-1">
                  Google Sign-In is available when <code className="font-mono">GOOGLE_CLIENT_ID</code> is configured in server environment secrets.
                </p>
              )}

              <div className="pt-4 border-t border-[#E2E8E0] flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-[#526054]">
                  New to FoodCircle?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-semibold text-[#16834A] hover:underline"
                  >
                    Create account
                  </button>
                </span>
                {serverConfig.adminClaimRequired && (
                  <button
                    type="button"
                    onClick={() => switchMode('admin-claim')}
                    className="text-xs font-medium text-[#526054] hover:text-[#16834A]"
                  >
                    First-run Admin Setup
                  </button>
                )}
              </div>
            </form>
          )}

          {/* REGISTER VIEW */}
          {authModal === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#202820] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Priya Sharma"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#202820] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#202820] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="priya@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#202820] mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                  >
                    {INDIAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#202820] mb-2">Select Your Role</label>
                <div className="grid grid-cols-1 gap-2">
                  {REGISTRATION_ROLES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id)}
                      className={`text-left px-3.5 py-2.5 rounded-xl border transition-colors ${
                        role === item.id
                          ? 'border-[#16834A] bg-[#EFFAF3]'
                          : 'border-[#E2E8E0] hover:bg-[#F8FAF7]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#202820]">{item.label}</span>
                        {role === item.id && <CheckCircle2 className="w-4 h-4 text-[#16834A]" />}
                      </div>
                      <p className="text-xs text-[#526054] mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create FoodCircle Account'}
              </button>

              <p className="text-sm text-center text-[#526054] pt-2 border-t border-[#E2E8E0]">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-[#16834A] hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* EMAIL VERIFICATION VIEW */}
          {authModal === 'verify' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="p-4 rounded-xl bg-[#EFFAF3] border border-[#C6E8D2] flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#16834A] shrink-0 mt-0.5" />
                <div className="text-sm text-[#202820]">
                  <p className="font-medium">Verification code issued</p>
                  <p className="text-xs text-[#526054] mt-1">
                    Enter the 6-digit code sent to <strong>{user?.email}</strong>.
                  </p>
                  {verificationCodeHint && (
                    <p className="mt-2 text-xs text-[#16834A] font-mono font-semibold">
                      Preview verification code: {verificationCodeHint}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">6-Digit Code</label>
                <input
                  type="text"
                  required
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] font-mono tracking-widest text-center text-base focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="py-2.5 px-4 rounded-lg border border-[#D4DFD2] text-sm font-medium text-[#202820] hover:bg-[#F8FAF7]"
                >
                  Resend Code
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeAuthModal();
                  navigate('dashboard');
                }}
                className="w-full text-xs text-[#526054] hover:text-[#202820] pt-1"
              >
                Skip for now and open dashboard
              </button>
            </form>
          )}

          {/* FORGOT / RESET PASSWORD VIEW */}
          {authModal === 'forgot' && (
            <div className="space-y-4">
              {resetStage === 'request' ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8E0] text-xs text-[#526054]">
                    <KeyRound className="w-4 h-4 text-[#16834A] shrink-0 mt-0.5" />
                    <span>Enter your registered email address to generate a one-time password reset code.</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#202820] mb-1">Registered Email</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold"
                  >
                    {loading ? 'Generating code...' : 'Send Reset Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetConfirm} className="space-y-4">
                  {resetCodeHint && (
                    <div className="p-3.5 rounded-xl bg-[#EFFAF3] border border-[#C6E8D2] text-xs text-[#16834A] font-mono font-semibold">
                      Preview reset code: {resetCodeHint}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[#202820] mb-1">Reset Code</label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="6-digit reset code"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#202820] mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold"
                  >
                    {loading ? 'Updating password...' : 'Update Password'}
                  </button>
                </form>
              )}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-sm text-[#526054] hover:text-[#16834A]"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* FIRST-RUN ADMIN CLAIM VIEW */}
          {authModal === 'admin-claim' && (
            <form onSubmit={handleAdminClaim} className="space-y-4">
              <div className="p-4 rounded-xl bg-[#EFFAF3] border border-[#C6E8D2] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#16834A] shrink-0 mt-0.5" />
                <div className="text-xs text-[#202820] leading-relaxed">
                  <strong>First-run Admin Setup:</strong> Create the initial administrator account
                  for moderating NGOs, user verifications, food listings, and safety reports. Once
                  claimed, this setup form permanently locks.
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">Admin Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Aarav Mehta"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@foodcircle.in"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#202820] mb-1">Admin Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Strong password (min 8 chars)"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4DFD2] text-sm focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#16834A] hover:bg-[#126B3C] text-white text-sm font-semibold"
              >
                {loading ? 'Initializing Admin...' : 'Claim Admin Console'}
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-sm text-[#526054] hover:text-[#16834A]"
              >
                Already claimed? Sign in instead
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
