import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Animated, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { C, G } from '../theme';
import { Header, Button3D, Card, hap, useToast } from '../ui';
import { useUser } from '../user';
import { WALLET_SEED, WALLET_ADDRESS } from '../data';
import * as api from '../api';

// ---------------- KYC — verificación real vía el motor GENESIS ID ----------------
// La captura de documento/selfie y el formulario AML ocurren en la propia
// interfaz web de GENESIS ID (ya construida y probada); esta pantalla solo
// abre esa verificación como un servicio y espera el resultado final.
export function Kyc({ nav, params }) {
  const { userId, onboardingToken } = params || {};
  const [step, setStep] = useState('intro'); // intro | opening | checking | done | review | failed
  const [failMsg, setFailMsg] = useState('');
  const toast = useToast();
  const { setSessionFromLogin, gid } = useUser();

  /**
   * Asks GENESIS ID what actually happened, instead of believing the deep
   * link. Browsers silently drop app-scheme redirects that no tap triggered,
   * so the callback often never fires even though verification went through —
   * this is what makes the app pick the identity up either way.
   */
  const resolveStatus = async ({ attempts = 6 } = {}) => {
    setStep('checking');
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await api.kycStatus({ userId, token: onboardingToken });

        if (res.status === 'approved') {
          // Approved means the account is verified, so the onboarding token
          // can now be traded for a real session — that's what pulls the GID,
          // name and passport photo into the app.
          try {
            const session = await api.exchangeOnboarding(onboardingToken);
            await api.saveSession(session);
            await setSessionFromLogin(session);
          } catch (e) {
            // Verified but the session couldn't be minted (e.g. offline). The
            // user can still sign in normally; don't block the happy path.
          }
          setStep('done');
          return;
        }
        if (res.status === 'rejected') {
          setFailMsg(res.rejectionReason || 'Tu verificación no pudo completarse. Intenta de nuevo con mejor iluminación y un documento válido.');
          setStep('failed');
          return;
        }
        if (res.status === 'pending') {
          setStep('review');
          return;
        }
        // still 'processing' — the engine takes about a minute to decide
      } catch (e) {
        if (e.status === 404) {
          // Never submitted anything — they backed out before finishing.
          setStep('intro');
          toast('Aún no completaste tu verificación.');
          return;
        }
      }
      await new Promise((r) => setTimeout(r, 4000));
    }
    setStep('review');
  };

  const startVerification = async () => {
    if (!userId || !onboardingToken) {
      setFailMsg('Falta información de tu registro. Vuelve a crear tu cuenta.');
      setStep('failed');
      return;
    }
    setStep('opening');
    try {
      const redirectUrl = Linking.createURL('kyc-callback');
      const url = api.kycVerifyUrl({ userId, onboardingToken, returnUrl: redirectUrl });
      await WebBrowser.openAuthSessionAsync(url, redirectUrl);
      // However that window closed — deep link, X button, swipe away — the
      // engine is the source of truth, so always go and ask.
      await resolveStatus();
    } catch (e) {
      setFailMsg('No se pudo abrir la verificación. Revisa tu conexión e intenta de nuevo.');
      setStep('failed');
    }
  };

  if (step === 'opening')
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={[styles.bigTitle, { marginTop: 22 }]}>Verificando identidad</Text>
        <Text style={styles.dim}>Completa el proceso en la ventana que se abrió…</Text>
      </View>
    );
  if (step === 'checking')
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={[styles.bigTitle, { marginTop: 22 }]}>Confirmando tu identidad</Text>
        <Text style={styles.dim}>Estamos recibiendo tu GENESIS ID…</Text>
      </View>
    );
  if (step === 'done')
    return (
      <View style={styles.center}>
        <View style={styles.checkBadge}><Ionicons name="checkmark" size={52} color={C.up} /></View>
        <Text style={styles.bigTitle}>Identidad verificada</Text>
        <Text style={styles.dim}>Bienvenido a Orden Global</Text>
        {gid ? (
          <View style={styles.gidPill}>
            <Ionicons name="shield-checkmark" size={14} color={C.up} />
            <Text style={styles.gidPillTxt}>{gid}</Text>
          </View>
        ) : null}
        <Button3D title="Crear mi billetera" onPress={() => nav.go('seed')} style={{ width: 240, marginTop: 26 }} />
      </View>
    );
  if (step === 'review')
    return (
      <View style={styles.center}>
        <View style={styles.checkBadge}><Ionicons name="time" size={46} color={C.gold} /></View>
        <Text style={styles.bigTitle}>En revisión</Text>
        <Text style={[styles.dim, { marginBottom: 26 }]}>Tu verificación está siendo revisada por nuestro equipo — puede tardar hasta 24 horas. Te avisaremos por correo.</Text>
        <Button3D title="Crear mi billetera" onPress={() => nav.go('seed')} style={{ width: 240 }} />
      </View>
    );
  if (step === 'failed')
    return (
      <View style={styles.center}>
        <View style={[styles.checkBadge, { borderColor: C.down, backgroundColor: 'rgba(240,119,107,0.12)' }]}><Ionicons name="close" size={52} color={C.down} /></View>
        <Text style={styles.bigTitle}>No se pudo verificar</Text>
        <Text style={[styles.dim, { marginBottom: 26 }]}>{failMsg}</Text>
        <Button3D title="Intentar de nuevo" onPress={() => setStep('intro')} style={{ width: 240 }} />
      </View>
    );

  return (
    <View style={{ flex: 1, paddingTop: 6 }}>
      <Header title="Verificación KYC" sub="Requerido para proteger tu cuenta" onBack={() => nav.go('auth')} />
      <ScrollView contentContainerStyle={{ padding: 22 }}>
        <View style={styles.kycIcon}><Ionicons name="shield-checkmark" size={34} color={C.gold} /></View>
        <Text style={[styles.bigTitle, { fontSize: 20 }]}>Verifica tu identidad</Text>
        <Text style={[styles.dim, { textAlign: 'center', marginBottom: 18 }]}>Verificación por el motor GENESIS ID — válida para todas las apps de Orden Global.</Text>
        {['Datos personales', 'Documento (frente y reverso)', 'Selfie · prueba de vida'].map((s, i) => (
          <Card key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, padding: 14 }}>
            <View style={styles.stepNo}><Text style={{ color: C.gold, fontWeight: '800' }}>{i + 1}</Text></View>
            <Text style={{ color: C.txt, fontWeight: '600', flex: 1 }}>{s}</Text>
            <Ionicons name="checkmark-circle" size={20} color={C.up} />
          </Card>
        ))}
        <Button3D title="Iniciar verificación" onPress={startVerification} style={{ marginTop: 12 }} />
        {/* Escape hatch for the case where the browser closed without handing
            control back — the identity may already be waiting on the engine. */}
        <Pressable onPress={() => { hap(); resolveStatus({ attempts: 2 }); }} style={{ marginTop: 16 }}>
          <Text style={styles.alreadyDone}>Ya completé mi verificación</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ---------------- Frase semilla (crear) ----------------
export function Seed({ nav }) {
  const [revealed, setRevealed] = useState(false);
  const [ack, setAck] = useState(false);
  const { session } = useUser();

  // Once the wallet exists, tell GENESIS ID which address this app knows the
  // user by, so their GID resolves to a Veta Wallet account ecosystem-wide.
  const finish = async () => {
    if (session?.accessToken) {
      try {
        await api.linkAddress({ accessToken: session.accessToken, address: WALLET_ADDRESS });
      } catch (e) {
        // Not worth blocking entry to the wallet — it re-links on next launch.
      }
    }
    nav.go('home');
  };

  return (
    <View style={{ flex: 1, paddingTop: 6 }}>
      <Header title="Frase de recuperación" onBack={() => nav.go('kyc')} />
      <ScrollView contentContainerStyle={{ padding: 22 }}>
        <View style={styles.kycIcon}><Ionicons name="lock-closed" size={32} color={C.gold} /></View>
        <Text style={[styles.bigTitle, { fontSize: 20 }]}>Tu llave maestra</Text>
        <Text style={[styles.dim, { textAlign: 'center', marginBottom: 16 }]}>Estas 12 palabras son la única forma de recuperar tu billetera. Guárdalas en orden y en un lugar seguro.</Text>
        <View style={styles.warn}>
          <Ionicons name="warning" size={20} color={C.down} />
          <Text style={styles.warnTxt}>Nunca compartas tu frase. Veta jamás te la pedirá.</Text>
        </View>
        <SeedGrid revealed={revealed} onReveal={() => { hap(); setRevealed(true); }} />
        <Pressable onPress={() => { hap(); setAck(!ack); }} style={styles.ackRow}>
          <View style={[styles.checkbox, ack && { backgroundColor: C.gold, borderColor: C.gold }]}>{ack && <Ionicons name="checkmark" size={14} color={C.darkText} />}</View>
          <Text style={styles.ackTxt}>Ya guardé mi frase en un lugar seguro.</Text>
        </Pressable>
        <Button3D title="Continuar a mi billetera" disabled={!revealed || !ack} onPress={finish} />
      </ScrollView>
    </View>
  );
}

// ---------------- Frase semilla (ver desde el menú) ----------------
export function SeedView({ nav }) {
  const [revealed, setRevealed] = useState(false);
  const toast = useToast();
  return (
    <View style={{ flex: 1, paddingTop: 6 }}>
      <Header title="Frase de recuperación" onBack={() => nav.back()} />
      <ScrollView contentContainerStyle={{ padding: 22 }}>
        <View style={styles.warn}>
          <Ionicons name="warning" size={20} color={C.down} />
          <Text style={styles.warnTxt}>Cualquiera con estas 12 palabras controla tus fondos. No hagas capturas de pantalla.</Text>
        </View>
        <SeedGrid revealed={revealed} onReveal={() => { hap(); setRevealed(true); }} />
        <Button3D variant="ghost" title="Copiar frase" icon="copy" onPress={() => { hap(); toast('Frase copiada'); }} />
      </ScrollView>
    </View>
  );
}

function SeedGrid({ revealed, onReveal }) {
  return (
    <View style={{ position: 'relative', marginBottom: 18 }}>
      <View style={styles.grid}>
        {WALLET_SEED.map((w, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.cellNo}>{i + 1}</Text>
            <Text style={styles.cellWord}>{revealed ? w : '••••••'}</Text>
          </View>
        ))}
      </View>
      {!revealed && (
        <Pressable onPress={onReveal} style={styles.revealOverlay}>
          <Ionicons name="eye" size={30} color={C.gold} />
          <Text style={{ color: C.txt2, fontWeight: '600', marginTop: 8 }}>Toca para revelar tu frase</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 34 },
  spinner: { width: 90, height: 90, borderRadius: 45, borderWidth: 5, borderColor: 'rgba(201,169,97,0.18)', borderTopColor: C.gold, marginBottom: 26 },
  checkBadge: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(62,217,160,0.12)', borderWidth: 2, borderColor: C.up, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  bigTitle: { fontSize: 22, fontWeight: '800', color: C.txt, marginBottom: 8, textAlign: 'center' },
  dim: { color: C.txt2, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  kycIcon: { width: 76, height: 76, borderRadius: 22, backgroundColor: '#0A3A3D', borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  stepNo: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(201,169,97,0.14)', alignItems: 'center', justifyContent: 'center' },
  warn: { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(240,119,107,0.08)', borderWidth: 1, borderColor: 'rgba(240,119,107,0.3)', borderRadius: 16, padding: 14, marginBottom: 18, alignItems: 'center' },
  warnTxt: { color: '#f4b4ac', fontSize: 12.5, flex: 1, lineHeight: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cell: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.input, borderWidth: 1, borderColor: C.line2, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  cellNo: { color: C.gold, fontSize: 12, opacity: 0.7, width: 16, textAlign: 'right' },
  cellWord: { color: C.txt, fontSize: 14, fontWeight: '500' },
  revealOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(4,26,27,0.55)', borderRadius: 14 },
  ackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  ackTxt: { color: C.txt2, fontSize: 13, flex: 1 },
  alreadyDone: { color: C.gold, fontWeight: '600', fontSize: 13.5, textAlign: 'center' },
  gidPill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(62,217,160,0.12)', borderWidth: 1, borderColor: 'rgba(62,217,160,0.35)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginTop: 14 },
  gidPillTxt: { color: C.goldLt, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
});
