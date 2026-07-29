import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Lang = 'es' | 'en';

const STORAGE_KEY = 'genesisid_lang';

// Spanish first: this is built for Orden Global's users, most of whom read
// Spanish, so an untranslated key falling back to English is the exception
// rather than the default experience.
const DICT: Record<string, { es: string; en: string }> = {
  // — Shared —
  'common.continue': { es: 'Continuar', en: 'Continue' },
  'common.back': { es: 'Atrás', en: 'Back' },
  'common.retry': { es: 'Intentar de nuevo', en: 'Try again' },
  'common.loading': { es: 'Cargando…', en: 'Loading...' },
  'common.of': { es: 'de', en: 'of' },

  // — Verification journey —
  'kyc.title': { es: 'GENESIS ID', en: 'GENESIS ID' },
  'kyc.subtitle': { es: 'Verificación de identidad segura', en: 'Secure Identity Verification' },
  'kyc.step.start': { es: 'Inicio', en: 'Start' },
  'kyc.step.aml': { es: 'Datos', en: 'Compliance' },
  'kyc.step.facial': { es: 'Rostro', en: 'Face' },
  'kyc.step.document': { es: 'Documento', en: 'Document' },
  'kyc.step.review': { es: 'Revisión', en: 'Review' },
  'kyc.step.done': { es: 'Listo', en: 'Completed' },
  'kyc.step.label': { es: 'Paso', en: 'Step' },

  'kyc.intro.title': { es: 'Verifica tu identidad', en: 'Verify Your Identity' },
  'kyc.intro.desc': {
    es: 'Completa tu verificación en unos pasos. El proceso toma unos 5 minutos.',
    en: 'Complete your identity verification in a few steps. This secure process takes about 5 minutes.'
  },
  'kyc.intro.aml': { es: 'Datos de cumplimiento', en: 'Compliance Information' },
  'kyc.intro.amlDesc': {
    es: 'Unas preguntas obligatorias antes de poder verificarte',
    en: 'A few required questions (AML/KYC) before we can verify you'
  },
  'kyc.intro.facial': { es: 'Verificación facial', en: 'Facial Verification' },
  'kyc.intro.facialDesc': {
    es: 'Mantén cada posición — se toman 5 ángulos automáticamente',
    en: 'Hold each position — 5 angles capture automatically to verify liveness'
  },
  'kyc.intro.document': { es: 'Escaneo de documento', en: 'Document Scan' },
  'kyc.intro.documentDesc': {
    es: 'Escanea tu identidad (frente y reverso), licencia o pasaporte',
    en: "Scan your ID (front + back), driver's license, or passport"
  },
  'kyc.intro.review': { es: 'Revisión', en: 'Review' },
  'kyc.intro.reviewDesc': {
    es: 'Aprobado al instante o revisado por nuestro equipo',
    en: 'Approved instantly or reviewed by our team'
  },
  'kyc.intro.requirements': { es: 'Necesitas:', en: 'Requirements:' },
  'kyc.intro.req1': { es: 'Buena iluminación (luz natural de preferencia)', en: 'Good lighting (natural light recommended)' },
  'kyc.intro.req2': { es: 'Documento de identidad o pasaporte vigente', en: 'Valid government-issued ID or passport' },
  'kyc.intro.req3': { es: 'Cámara del teléfono o computadora', en: 'Webcam or mobile device camera' },
  'kyc.intro.req4': { es: 'Conexión a internet', en: 'Internet connection' },
  'kyc.intro.start': { es: 'Iniciar verificación', en: 'Start Verification' },

  'kyc.uploading': { es: 'Subiendo tu verificación…', en: 'Uploading your verification...' },

  // — Review / progress —
  'kyc.review.title': { es: 'Estamos revisando tu identidad', en: 'Reviewing your identity' },
  'kyc.review.subtitle': {
    es: 'No cierres esta ventana. Esto suele tardar un par de minutos.',
    en: "Don't close this window. This usually takes a couple of minutes."
  },
  'kyc.review.received': { es: 'Documentos recibidos', en: 'Documents received' },
  'kyc.review.quality': { es: 'Revisando calidad de las fotos', en: 'Checking photo quality' },
  'kyc.review.face': { es: 'Analizando tu rostro', en: 'Analysing your face' },
  'kyc.review.document': { es: 'Validando tu documento', en: 'Validating your document' },
  'kyc.review.identity': { es: 'Generando tu GENESIS ID', en: 'Issuing your GENESIS ID' },
  'kyc.review.waitNote': {
    es: 'Si algo necesita una segunda mirada, puede tardar hasta 24 horas. Te avisamos por correo — no necesitas quedarte aquí.',
    en: "If anything needs a closer look it can take up to 24 hours. We'll email you either way — you don't need to stay here."
  },

  'kyc.pending.title': { es: 'En revisión', en: 'Under Review' },
  'kyc.pending.desc': {
    es: 'Tu verificación necesita una revisión de nuestro equipo. Puede tardar hasta 24 horas.',
    en: 'Your verification needs a closer look from our team. This can take up to 24 hours.'
  },
  'kyc.pending.email': {
    es: 'Te enviaremos un correo en cuanto esté lista.',
    en: "We'll send you an email as soon as the review is complete."
  },

  'kyc.approved.title': { es: '¡Verificación aprobada!', en: 'Verification Approved!' },
  'kyc.approved.desc': {
    es: 'Tu identidad quedó verificada. Ya tienes acceso a todas las apps de Orden Global.',
    en: 'Your identity has been verified. You now have access to all Orden Global apps.'
  },
  'kyc.approved.yourGid': { es: 'Tu GENESIS ID', en: 'Your GENESIS ID' },

  'kyc.failed.title': { es: 'No pudimos verificarte', en: 'Verification Failed' },
  'kyc.failed.desc': {
    es: 'Tu verificación no pudo completarse. Intenta de nuevo con mejor iluminación y un documento claro.',
    en: 'Your verification could not be completed. Please try again with better lighting and a clearer document.'
  },

  'kyc.resume.title': { es: 'Retomando donde quedaste…', en: 'Picking up where you left off...' },

  // — Facial capture —
  'facial.title': { es: 'Verificación facial', en: 'Facial Verification' },
  'facial.desc': {
    es: 'Mantén cada posición — la cámara toma la foto sola al confirmar el ángulo.',
    en: 'Hold each position steady — the camera will capture automatically once it confirms the angle.'
  },
  'facial.position': { es: 'Posición', en: 'Position' },
  'facial.initCamera': { es: 'Iniciando cámara…', en: 'Initializing camera...' },
  'facial.loadingDetector': { es: 'Cargando detector facial…', en: 'Loading face detector...' },
  'facial.cameraError': {
    es: 'No pudimos acceder a tu cámara. Revisa los permisos del navegador e intenta de nuevo.',
    en: "Couldn't access your camera. Check browser permissions and try again."
  },

  // — Document capture —
  'doc.title': { es: 'Escaneo de documento', en: 'Document Scan' },

  // — Auth —
  'auth.register.title': { es: 'Crea tu identidad verificada', en: 'Create Your Verified Identity' },
  'auth.login.title': { es: 'Entra a tu cuenta', en: 'Sign in to your account' },
  'auth.email': { es: 'Correo electrónico', en: 'Email Address' },
  'auth.fullName': { es: 'Nombre completo', en: 'Full Name' },
  'auth.phone': { es: 'Teléfono (opcional)', en: 'Phone Number (Optional)' },
  'auth.password': { es: 'Contraseña', en: 'Password' },
  'auth.confirmPassword': { es: 'Confirmar contraseña', en: 'Confirm Password' },
  'auth.createAccount': { es: 'Crear cuenta', en: 'Create Account' },
  'auth.creating': { es: 'Creando cuenta…', en: 'Creating Account...' },
  'auth.signIn': { es: 'Entrar', en: 'Sign In' },
  'auth.haveAccount': { es: '¿Ya tienes cuenta?', en: 'Already have an account?' },
  'auth.noAccount': { es: '¿No tienes cuenta?', en: "Don't have an account?" },
  'auth.login': { es: 'Entrar', en: 'Login' },
  'auth.register': { es: 'Regístrate', en: 'Register' },
  'auth.forgot': { es: '¿Olvidaste tu contraseña?', en: 'Forgot your password?' },
  'auth.continueVerification': {
    es: 'Continuar mi verificación',
    en: 'Continue my verification'
  },
  'server.notVerified': {
    es: 'Tu cuenta aún no está verificada. Termina tu verificación para entrar.',
    en: 'User not verified. Complete identity verification first.'
  },
  'server.invalidCredentials': { es: 'Correo o contraseña incorrectos.', en: 'Invalid credentials' },
  'server.emailRegistered': { es: 'Este correo ya tiene una cuenta.', en: 'Email already registered' },
  'server.deactivated': {
    es: 'Esta cuenta fue desactivada. Vuelve a registrarte con este correo para reactivarla.',
    en: 'This account has been deactivated. Register again with this email to reactivate it.'
  },
  'server.sessionExpired': { es: 'Tu sesión venció. Vuelve a entrar.', en: 'Your session expired. Please sign in again.' },
  'server.alreadyVerified': { es: 'Esta cuenta ya está verificada. Solo inicia sesión.', en: 'This account is already verified. Just sign in.' },
  'server.tooMany': { es: 'Demasiados intentos. Espera un momento y vuelve a probar.', en: 'Too many attempts. Please wait a moment and try again.' },
  'auth.emailPasswordRequired': { es: 'Ingresa tu correo y contraseña.', en: 'Email and password are required' },
  'auth.welcomeBack': { es: '¡Bienvenido de vuelta!', en: 'Welcome back!' },
  'auth.loginFailed': { es: 'No pudimos iniciar sesión.', en: 'Login failed' },
  'auth.signingIn': { es: 'Entrando…', en: 'Signing in...' },
  'auth.passwordsNoMatch': { es: 'Las contraseñas no coinciden.', en: 'Passwords do not match' },
  'auth.passwordShort': { es: 'La contraseña debe tener al menos 8 caracteres.', en: 'Password must be at least 8 characters' },
  'auth.accountCreated': { es: 'Cuenta creada. Vamos a verificar tu identidad…', en: 'Account created! Redirecting to verification...' },
  'auth.registerFailed': { es: 'No pudimos crear la cuenta.', en: 'Registration failed' },
  'auth.emailTaken': { es: 'Este correo ya tiene una cuenta.', en: 'This email already has an account.' },
  'auth.secured': { es: 'Tus datos van cifrados y protegidos.', en: 'Your data is encrypted and secured.' },
  'auth.alreadyRegistered': {
    es: 'Esta cuenta ya existe y le falta terminar la verificación.',
    en: 'This account already exists and still needs to finish verification.'
  }
};

/**
 * The engine answers in English. Rather than translating it server-side and
 * breaking every existing consumer, known messages are mapped to keys here so
 * the person reading them sees their own language.
 */
const SERVER_MESSAGES: Record<string, string> = {
  'User not verified. Complete identity verification first.': 'server.notVerified',
  'Invalid credentials': 'server.invalidCredentials',
  'Email already registered': 'server.emailRegistered',
  'This account has been deactivated. Contact support.': 'server.deactivated',
  'User not found or deactivated': 'server.deactivated',
  'Session expired. Please log in again.': 'server.sessionExpired',
  'Invalid or expired token': 'server.sessionExpired',
  'Invalid or expired onboarding token': 'server.sessionExpired',
  'This account is already verified. Sign in normally.': 'server.alreadyVerified',
  'Too many requests, please try again later.': 'server.tooMany'
};

export function translateServerMessage(message: string, t: (k: string) => string): string {
  const key = SERVER_MESSAGES[message?.trim()];
  return key ? t(key) : message;
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nCtx = createContext<I18nValue>({ lang: 'es', setLang: () => {}, t: (k) => k });

export const useI18n = () => useContext(I18nCtx);
/** Shorthand for components that only need the translate function. */
export const useT = () => useI18n().t;

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === 'es' || stored === 'en') {
      setLangState(stored);
      return;
    }
    // No stored choice yet — follow the browser, defaulting to Spanish.
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('en')) {
      setLangState('en');
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string) => {
      const entry = DICT[key];
      if (!entry) return key;
      return entry[lang] ?? entry.es;
    },
    [lang]
  );

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

/**
 * `tone` picks the palette for the surface behind it: "light" for the dark
 * verification background, "dark" for the white header. Without it the toggle
 * is invisible on one of the two.
 */
export function LanguageToggle({
  className = '',
  tone = 'light'
}: {
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const { lang, setLang } = useI18n();
  const onLight = tone === 'light';

  return (
    <div
      className={`inline-flex rounded-lg border overflow-hidden text-xs font-semibold ${
        onLight ? 'border-white/25' : 'border-gray-300'
      } ${className}`}
    >
      {(['es', 'en'] as Lang[]).map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            aria-label={code === 'es' ? 'Español' : 'English'}
            className={`px-2.5 py-1 transition ${
              active
                ? onLight
                  // On the blue/dark surfaces a blue "active" pill disappears
                  // into the page, so invert it there instead.
                  ? 'bg-white text-blue-700'
                  : 'bg-blue-600 text-white'
                : onLight
                ? 'text-white/80 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
