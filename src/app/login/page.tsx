'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/admin',
      });

      if (result?.error) {
        setError("Nom d'utilisateur ou mot de passe incorrect");
      } else {
        router.push('/admin');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 via-white to-zinc-100 px-4 md:px-0">
      <div className="w-full max-w-md rounded-3xl bg-white px-7 py-8 md:px-9 md:py-10 shadow-[0_18px_60px_rgba(15,23,42,0.10)] ring-1 ring-zinc-100">
        {/* Logo / Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo height={72} priority />
          <span className="inline-flex items-center rounded-full bg-zinc-50 px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500 ring-1 ring-zinc-200">
            Tableau de bord admin
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1">
            <p className="text-[11px] text-zinc-500">Nom d'utilisateur par défaut : <span className="font-medium text-zinc-800">admin</span></p>
            <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900/80">
              <span className="mr-2 text-zinc-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M10 2a4 4 0 0 0-4 4v1a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z" />
                  <path d="M4.25 12A2.25 2.25 0 0 0 2 14.25v.5C2 16.54 3.46 18 5.25 18h9.5A3.25 3.25 0 0 0 18 14.75v-.5A2.25 2.25 0 0 0 15.75 12h-11.5Z" />
                </svg>
              </span>
              <input
                type="text"
                className="h-6 w-full border-none bg-transparent p-0 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
                placeholder="admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-800">Mot de passe</label>
            <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900/80">
              <span className="mr-2 text-zinc-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M10 2a4 4 0 0 0-4 4v2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1V6a4 4 0 0 0-4-4Z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="h-6 w-full border-none bg-transparent p-0 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="ml-2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.03 2.03C2.64 7.01 1.47 8.7 1 10c1.2 3.2 4.7 6.5 10 6.5 1.61 0 3.06-.3 4.35-.82l2.12 2.12a.75.75 0 1 0 1.06-1.06l-16-16Z" />
                    <path d="M9.53 8.03 11 9.5a1.5 1.5 0 0 0 2.12 2.12l1.47 1.47A3.5 3.5 0 0 1 9.53 8.03Z" />
                    <path d="M12.97 7.03 15 9.06a3.5 3.5 0 0 0-2.03-2.03Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M10 4.5C5.5 4.5 2.2 7.3 1 10c1.2 2.7 4.5 5.5 9 5.5s7.8-2.8 9-5.5c-1.2-2.7-4.5-5.5-9-5.5Zm0 9a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Primary button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`mt-4 w-full rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ff1744] py-2.5 text-sm font-medium text-white shadow-[0_14px_40px_rgba(248,113,113,0.35)] transition hover:brightness-110 active:translate-y-[1px] ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Connexion…' : 'Se connecter'}
          </button>

          {/* Secondary button */}
          <Link
            href="/"
            className="mt-3 flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300"
          >
            <span className="mr-2 text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M10 2.25a.75.75 0 0 0-.47.17l-7 5.75A.75.75 0 0 0 2 9h1v6.25A1.75 1.75 0 0 0 4.75 17h3.5A1.75 1.75 0 0 0 10 15.25V12h2v3.25A1.75 1.75 0 0 0 13.75 17h3.5A1.75 1.75 0 0 0 19 15.25V9h1a.75.75 0 0 0 .47-1.33l-7-5.75A.75.75 0 0 0 10 2.25Z" />
              </svg>
            </span>
            Retour à l'accueil
          </Link>
        </form>
      </div>
    </div>
  );
}

