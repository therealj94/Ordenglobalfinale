import React, { useState } from 'react';
import { View, Text, ImageBackground, Pressable, TextInput, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';
import { Logo, Button3D, hap, useToast } from '../ui';
import { useUser } from '../user';
import * as api from '../api';
import { WALLET_ADDRESS } from '../data';

export default function Auth({ nav }) {
  const toast = useToast();
  const { setSessionFromLogin } = useUser();
  const [tab, setTab] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const login = tab === 'login';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const switchTab = (k) => { hap(); setTab(k); setError(''); setNeedsVerification(false); };

  const submit = async () => {
    setError('');
    if (!email || !password) { setError('Ingresa tu correo y contraseña.'); return; }
    if (!login && !fullName) { setError('Ingresa tu nombre completo.'); return; }

    setBusy(true);
    try {
      if (login) {
        const data = await api.login({ email: email.trim(), password });
        await api.saveSession(data);
        await setSessionFromLogin(data);
        // Someone signing in on a new device already has their GENESIS ID —
        // linking here is what actually connects it to Veta Wallet, since
        // they never pass through wallet creation again.
        api.linkAddress({ accessToken: data.accessToken, address: WALLET_ADDRESS }).catch(() => {});
        toast(`Bienvenido, ${data.user.fullName || data.user.email}`);
        nav.go('home');
      } else {
        const data = await api.register({ email: email.trim(), password, fullName: fullName.trim() });
        toast('Cuenta creada. Verifica tu identidad para continuar.');
        nav.go('kyc', { userId: data.userId, onboardingToken: data.onboardingToken });
      }
    } catch (e) {
      // An existing account that never finished verification is the one login
      // failure the user can actually fix from here — offer that instead of a
      // dead end telling them they're not verified.
      if (login && /verif/i.test(e.message)) setNeedsVerification(true);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const continueVerification = async () => {
    setError('');
    setBusy(true);
    try {
      const data = await api.verificationSession({ email: email.trim(), password });
      nav.go('kyc', { userId: data.userId, onboardingToken: data.onboardingToken });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitForgotPassword = async () => {
    if (!email) { setError('Ingresa tu correo para recuperar tu contraseña.'); return; }
    setError('');
    setBusy(true);
    try {
      await api.forgotPassword({ email: email.trim() });
      toast('Si ese correo existe, te enviamos un enlace para restablecer tu contraseña.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ImageBackground source={require('../../assets/login-bg.jpg')} style={{ flex: 1 }} resizeMode="cover">
      <LinearGradient colors={['rgba(9,55,52,0.55)', 'rgba(3,20,21,0.82)']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 22 }}>
          <Logo size={92} />
          <Text style={styles.brand}>veta <Text style={styles.italic}>wallet</Text></Text>
          <Text style={styles.tag}>ORDEN GLOBAL</Text>
        </View>

        <BlurView intensity={38} tint="dark" style={styles.glass}>
          <View style={styles.glassInner}>
            <View style={styles.seg}>
              {['login', 'register'].map((k) => (
                <Pressable key={k} onPress={() => switchTab(k)} style={[styles.segBtn, tab === k && styles.segOn]}>
                  <Text style={[styles.segTxt, tab === k && styles.segTxtOn]}>{k === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>
                </Pressable>
              ))}
            </View>

            {!login && (
              <Input label="Nombre completo" placeholder="José Enamorado" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            )}
            <Input
              label="Correo electrónico"
              placeholder="tu@correo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{ marginBottom: 6 }}>
              <Text style={styles.label}>Contraseña</Text>
              <View>
                <TextInput
                  placeholderTextColor="#6f938f"
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  style={[styles.input, { paddingRight: 44 }]}
                />
                <Pressable onPress={() => setShowPw(!showPw)} style={styles.eye}>
                  <Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color={C.txt2} />
                </Pressable>
              </View>
            </View>

            {login ? (
              <Pressable onPress={submitForgotPassword} disabled={busy}>
                <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            ) : (
              <Text style={styles.terms}>Al crear la cuenta aceptas los Términos y la Política de Privacidad.</Text>
            )}

            {!!error && <Text style={styles.error}>{error}</Text>}

            {needsVerification && !busy && (
              <Pressable onPress={() => { hap(); continueVerification(); }} style={styles.verifyCta}>
                <Ionicons name="shield-checkmark" size={17} color={C.gold} />
                <Text style={styles.verifyCtaTxt}>Continuar mi verificación con GENESIS ID</Text>
              </Pressable>
            )}

            {busy ? (
              <View style={[styles.loadingBtn, { marginTop: 8 }]}>
                <ActivityIndicator color={C.darkText} />
              </View>
            ) : (
              <Button3D title={login ? 'Ingresar' : 'Continuar a verificación'} onPress={submit} style={{ marginTop: 8 }} />
            )}

            {login && (
              <>
                <View style={styles.divider}><View style={styles.dline} /><Text style={styles.dtxt}>o continúa con</Text><View style={styles.dline} /></View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Social icon="finger-print" label="Face ID" />
                  <Social icon="logo-apple" label="Apple" />
                </View>
              </>
            )}
          </View>
        </BlurView>
        <Text style={styles.foot}>Protegido por Orden Global Blockchain</Text>
      </ScrollView>
    </ImageBackground>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#6f938f" style={styles.input} {...props} />
    </View>
  );
}
function Social({ icon, label }) {
  return (
    <Pressable onPress={hap} style={styles.social}>
      <Ionicons name={icon} size={17} color={C.gold} style={{ marginRight: 7 }} />
      <Text style={{ color: C.txt, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 22, paddingTop: 80 },
  brand: { fontSize: 26, fontWeight: '800', color: '#EAD79C', letterSpacing: 1, marginTop: 6 },
  italic: { fontWeight: '300', fontStyle: 'italic', color: '#C9A961' },
  tag: { color: 'rgba(243,236,217,0.7)', fontSize: 11, letterSpacing: 4, marginTop: 4 },
  glass: { borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201,169,97,0.28)' },
  glassInner: { padding: 22, backgroundColor: 'rgba(10,52,54,0.35)' },
  seg: { flexDirection: 'row', backgroundColor: 'rgba(6,34,35,0.6)', borderRadius: 14, padding: 4, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(46,116,119,0.4)' },
  segBtn: { flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center' },
  segOn: { backgroundColor: C.gold },
  segTxt: { color: C.txt2, fontWeight: '600', fontSize: 13.5 },
  segTxtOn: { color: C.darkText },
  label: { fontSize: 12, color: C.txt2, marginBottom: 7, fontWeight: '500' },
  input: { backgroundColor: 'rgba(12,58,59,0.75)', borderWidth: 1.5, borderColor: 'rgba(46,116,119,0.5)', borderRadius: 14, paddingHorizontal: 15, paddingVertical: 14, color: C.txt, fontSize: 15 },
  eye: { position: 'absolute', right: 12, top: 12, padding: 2 },
  forgot: { color: C.gold, fontWeight: '600', fontSize: 13, textAlign: 'right', marginVertical: 14 },
  terms: { color: C.txt2, fontSize: 12, marginVertical: 14, lineHeight: 17 },
  error: { color: '#F19A9A', fontSize: 12.5, marginBottom: 12, lineHeight: 17 },
  verifyCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(201,169,97,0.12)', borderWidth: 1, borderColor: 'rgba(201,169,97,0.45)', borderRadius: 13, paddingVertical: 13, marginBottom: 12 },
  verifyCtaTxt: { color: C.goldLt, fontWeight: '700', fontSize: 13 },
  loadingBtn: { height: 53, borderRadius: 17, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dline: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dtxt: { color: C.txt3, fontSize: 12 },
  social: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 13, paddingVertical: 12 },
  foot: { color: 'rgba(243,236,217,0.7)', fontSize: 12, textAlign: 'center', marginTop: 18 },
});
