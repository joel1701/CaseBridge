import { useId, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CircleAlert, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spec } from '@/components/ui/spec';
import { HeroScene } from '@/features/landing/scene/HeroScene';
import { useMocks } from '@/shared/api/client';
import {
  authErrorCode,
  demoAccounts,
  login,
  MOCK_PASSWORD,
} from '@/shared/api/auth';
import './login.css';

const formErrors: Record<string, string> = {
  INVALID_CREDENTIALS: "That email and password don't match. Try again.",
  RATE_LIMITED: 'Too many attempts. Try again in 15 minutes.',
  NETWORK: "Can't reach Setu right now. Check your connection and try again.",
};
const fallbackError = 'Something went wrong signing in. Try again.';

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface FieldErrors {
  identifier?: string;
  password?: string;
}

function validate(identifier: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const id = identifier.trim();
  if (!id)
    errors.identifier = useMocks
      ? 'Enter your officer email or ID.'
      : 'Enter your officer email.';
  else if (!useMocks && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id))
    errors.identifier = id.includes('@')
      ? 'Enter a valid email address.'
      : "Sign in with your officer email. ID sign-in isn't available yet.";
  if (!password) errors.password = 'Enter your password.';
  else if (new TextEncoder().encode(password).length > 72)
    errors.password = 'Passwords are at most 72 bytes.';
  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-2 text-sm text-indigo-hi">
      <CircleAlert size={16} aria-hidden="true" className="mt-0.5 flex-none" />
      {message}
    </p>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const uid = useId();
  const sceneRef = useRef<HTMLDivElement>(null);
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const ids = {
    identifier: `${uid}-identifier`,
    identifierError: `${uid}-identifier-error`,
    password: `${uid}-password`,
    passwordError: `${uid}-password-error`,
    formError: `${uid}-form-error`,
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const errors = validate(identifier, password);
    setFieldErrors(errors);
    setFormError(null);
    if (errors.identifier) return identifierRef.current?.focus();
    if (errors.password) return passwordRef.current?.focus();
    setPending(true);
    try {
      const user = await login(identifier, password);
      queryClient.setQueryData(['me'], user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(formErrors[authErrorCode(err)] ?? fallbackError);
      setPending(false);
      passwordRef.current?.select();
    }
  }

  const demo = demoAccounts[0];

  return (
    <div className="grid min-h-svh md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section
        className="login-scene flex flex-col justify-between gap-8 p-[max(var(--m),env(safe-area-inset-left,0px))] max-md:min-h-[200px] max-md:justify-end"
        ref={sceneRef}
        aria-label="Setu"
      >
        {!reduceMotion && (
          <HeroScene
            frameRef={sceneRef}
            heroRef={sceneRef}
            reduce={false}
            labels={false}
          />
        )}
        <p className="login-word relative z-[1] max-md:text-[64px]">setu</p>
        <p className="login-line lead relative z-[1] max-md:text-base">
          One view of every case, across every AICTE bureau.
        </p>
      </section>

      <main
        data-tone="deep"
        className="flex items-center justify-center px-[max(var(--m),env(safe-area-inset-right,0px))] py-12"
      >
        <div className="w-full max-w-[24rem]">
          <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.86] font-bold text-indigo-hi lowercase [font-stretch:75%]">
            sign in
          </h1>
          <p className="mt-3 text-sm text-subtle">
            Authorized AICTE officials only
          </p>

          <form className="mt-8 grid gap-5" noValidate onSubmit={onSubmit}>
            <div>
              <label
                htmlFor={ids.identifier}
                className="block text-[15px] font-bold"
              >
                {useMocks ? 'Officer email or ID' : 'Officer email'}
              </label>
              <input
                ref={identifierRef}
                id={ids.identifier}
                name="username"
                className="field mt-2"
                type="text"
                inputMode={useMocks ? 'text' : 'email'}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={
                  useMocks
                    ? 'name@example.invalid or ID'
                    : 'name@example.invalid'
                }
                value={identifier}
                disabled={pending}
                onChange={(e) => setIdentifier(e.target.value)}
                aria-invalid={fieldErrors.identifier ? true : undefined}
                aria-describedby={
                  fieldErrors.identifier ? ids.identifierError : undefined
                }
              />
              <FieldError
                id={ids.identifierError}
                message={fieldErrors.identifier}
              />
            </div>

            <div>
              <label
                htmlFor={ids.password}
                className="block text-[15px] font-bold"
              >
                Password
              </label>
              <div className="relative mt-2">
                <input
                  ref={passwordRef}
                  id={ids.password}
                  name="password"
                  className="field pr-12"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  disabled={pending}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={fieldErrors.password ? true : undefined}
                  aria-describedby={
                    fieldErrors.password ? ids.passwordError : undefined
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center text-subtle hover:text-snow"
                  aria-controls={ids.password}
                  aria-pressed={showPassword}
                  disabled={pending}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                  <span className="sr-only">Show password</span>
                </button>
              </div>
              <FieldError
                id={ids.passwordError}
                message={fieldErrors.password}
              />
            </div>

            {formError && (
              <div
                id={ids.formError}
                role="alert"
                className="flex items-start gap-3 border border-line bg-panel p-4 text-sm shadow-[inset_3px_0_0_var(--ind-hi)]"
              >
                <CircleAlert
                  size={18}
                  aria-hidden="true"
                  className="mt-0.5 flex-none text-indigo-hi"
                />
                {formError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={pending}
              aria-busy={pending}
            >
              {pending && (
                <Loader2
                  size={18}
                  aria-hidden="true"
                  className="animate-spin"
                />
              )}
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {useMocks && (
            <aside
              aria-label="Demo access"
              className="mt-10 border-t border-line pt-5"
            >
              <p className="text-[13px] font-bold">
                Demo access{' '}
                <span className="wide text-subtle">· synthetic</span>
              </p>
              <Spec
                size="sm"
                className="mt-3 grid-cols-1"
                items={[
                  { label: 'Email', value: demo.email },
                  { label: 'or ID', value: demo.id },
                  { label: 'Password', value: MOCK_PASSWORD },
                ]}
              />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
