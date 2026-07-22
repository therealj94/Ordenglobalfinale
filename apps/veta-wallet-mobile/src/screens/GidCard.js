import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, Share, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { C } from '../theme';
import { Header, Button3D, hap } from '../ui';
import { useUser } from '../user';
import { verifyGidUrl } from '../api';

const PAPER = '#F6EFDB';
const INK = '#2B2013';
const INK2 = '#3A2C18';
const AMBER = '#8A6A3A';
const NAVY = ['#1A2A4A', '#152238', '#0F1A2E'];

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

// Decorative passport-style machine-readable zone — NOT a real ICAO 9303 MRZ
// (no check digits), purely visual flavor to match the bio-page aesthetic.
function buildMrz(fullName, gid, nationality) {
  const clean = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  const surname = clean(parts[parts.length - 1] || '');
  const given = clean(parts.slice(0, -1).join(' ') || parts[0] || '');
  const country = clean(nationality || 'UNK').padEnd(3, 'X').slice(0, 3);
  let line1 = `ID${country}${surname}<<${given}`;
  line1 = (line1 + '<'.repeat(36)).slice(0, 36);
  const gidCompact = clean(gid).padEnd(16, '<').slice(0, 16);
  let line2 = `${gidCompact}${country}${'<'.repeat(16)}`.slice(0, 36);
  return `${line1}\n${line2}`;
}

// Guilloché-style engraving — overlapping waves at low opacity, the engine-
// turned security print look of real passport paper.
function Guilloche() {
  const rows = [22, 44, 66, 88, 110, 132, 154, 176, 198, 220];
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 300 240" preserveAspectRatio="none">
      {rows.map((y, i) => (
        <Path key={i} d={`M-20 ${y} Q 40 ${y - 16} 90 ${y} T 200 ${y} T 320 ${y}`} stroke={AMBER} strokeWidth={0.5} fill="none" opacity={0.5} />
      ))}
    </Svg>
  );
}

function Line({ label, value, valueStyle }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, valueStyle]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function GidCard({ nav }) {
  const { user, profile, gid, displayName, isLoggedIn } = useUser();
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(lift, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 7 }),
    ]).start();
  }, []);

  const verified = user?.status === 'verified' && !!gid;

  const share = async () => {
    hap();
    try {
      await Share.share({
        message: `Verifica mi GENESIS ID (${gid}) en el ecosistema Orden Global: ${verifyGidUrl(gid)}`,
      });
    } catch (e) {}
  };

  // No verified identity yet → honest prompt instead of a fake card.
  if (!verified) {
    return (
      <View style={{ flex: 1, paddingTop: 6 }}>
        <Header title="Mi GENESIS ID" onBack={() => nav.back()} />
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}><Ionicons name="shield-outline" size={40} color={C.gold} /></View>
          <Text style={styles.emptyTitle}>Aún no tienes tu GENESIS ID</Text>
          <Text style={styles.emptyText}>
            {isLoggedIn
              ? 'Completa la verificación de identidad para recibir tu GENESIS ID, válido en todo el ecosistema Orden Global.'
              : 'Inicia sesión con tu cuenta verificada para ver tu GENESIS ID tipo pasaporte.'}
          </Text>
          <Button3D
            title={isLoggedIn ? 'Verificar identidad' : 'Iniciar sesión'}
            onPress={() => nav.go(isLoggedIn ? 'kyc' : 'auth')}
            style={{ width: 240, marginTop: 24 }}
          />
        </View>
      </View>
    );
  }

  const mrz = buildMrz(displayName, gid, profile?.nationality);

  return (
    <View style={{ flex: 1, paddingTop: 6 }}>
      <Header title="Mi GENESIS ID" onBack={() => nav.back()} />
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
          <View style={styles.card}>
            {/* Header cover band */}
            <LinearGradient colors={NAVY} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.band}>
              <View style={styles.crest}><Ionicons name="shield-checkmark" size={18} color="#F1C878" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brand}>GENESIS ID</Text>
                <Text style={styles.brandSub}>BY ORDEN GLOBAL ECOSYSTEM</Text>
              </View>
            </LinearGradient>
            <LinearGradient colors={['#96793F', '#F8EFCF', '#96793F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.goldRule} />

            {/* Paper body */}
            <View style={styles.paper}>
              <Guilloche />
              <View style={styles.crestGhost} pointerEvents="none">
                <Ionicons name="shield" size={240} color="#4A3618" style={{ opacity: 0.07 }} />
              </View>
              <View style={styles.frame} pointerEvents="none" />

              <View style={styles.bioRow}>
                <View style={styles.photoBox}>
                  {profile?.idCardPhoto ? (
                    <Image source={{ uri: profile.idCardPhoto }} style={styles.photo} resizeMode="cover" />
                  ) : (
                    <View style={styles.photoEmpty}><Ionicons name="person" size={38} color="#b7a98a" /></View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kicker}>GLOBAL DIGITAL IDENTITY</Text>
                  <Line label="GENESIS ID NUMBER" value={gid} valueStyle={styles.mono} />
                  <Line label="NATIONALITY" value={profile?.nationality || '—'} />
                  <Line label="DATE OF BIRTH" value={formatDate(profile?.dateOfBirth)} />
                  <View style={{ marginTop: 2 }}>
                    <Text style={styles.fieldLabel}>STATUS</Text>
                    <Text style={styles.verified}>VERIFIED <Text style={{ color: '#B8860B' }}>✓</Text></Text>
                  </View>
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <Text style={styles.fullName} numberOfLines={1}>{displayName}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.bottomRow}>
                <View style={{ flexDirection: 'row', gap: 18 }}>
                  <View>
                    <Text style={styles.fieldLabel}>ISSUED</Text>
                    <Text style={styles.smallVal}>{formatDate(profile?.gidIssuedAt)}</Text>
                  </View>
                  <View>
                    <Text style={styles.fieldLabel}>VALID UNTIL</Text>
                    <Text style={styles.smallVal}>{formatDate(profile?.gidExpiresAt)}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.qrBox}>
                    <QRCode value={verifyGidUrl(gid)} size={64} color={INK} backgroundColor="transparent" />
                  </View>
                  <Text style={styles.scan}>SCAN TO VERIFY</Text>
                </View>
              </View>

              {profile?.signature && (
                <View style={{ marginTop: 12, borderTopColor: 'rgba(138,106,58,0.3)', borderTopWidth: 1, paddingTop: 8 }}>
                  <Text style={styles.fieldLabel}>HOLDER'S SIGNATURE</Text>
                  <Image source={{ uri: profile.signature }} style={styles.signature} resizeMode="contain" />
                </View>
              )}
            </View>

            {/* MRZ band */}
            <View style={styles.mrzBand}>
              <Text style={styles.mrz}>{mrz}</Text>
            </View>
            {/* Footer band */}
            <LinearGradient colors={NAVY} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.footBand}>
              <Text style={styles.footTxt}>GENESIS ID · ORDEN GLOBAL ECOSYSTEM</Text>
            </LinearGradient>
          </View>

          <View style={{ marginTop: 20 }}>
            <Button3D title="Compartir mi GENESIS ID" icon="share-outline" onPress={share} />
          </View>
          <Text style={styles.note}>
            Tu GENESIS ID es tu identidad verificada única en todo el ecosistema Orden Global. Con ella accedes a Veta Wallet y a las demás apps sin volver a verificarte.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#C9B98A', backgroundColor: PAPER, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 12 },
  band: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 14 },
  crest: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(241,200,120,0.5)', alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  brandSub: { color: 'rgba(241,200,120,0.7)', fontSize: 7.5, letterSpacing: 2, marginTop: 1 },
  goldRule: { height: 3, width: '100%' },
  paper: { position: 'relative', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, overflow: 'hidden' },
  crestGhost: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: { position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderWidth: 2, borderColor: 'rgba(138,106,58,0.25)', borderRadius: 3 },
  bioRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  photoBox: { width: 92, height: 122, backgroundColor: '#e6ddc6', borderWidth: 2, borderColor: 'rgba(74,54,24,0.4)', overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 10, letterSpacing: 1.5, color: 'rgba(120,90,46,0.85)', fontWeight: '700', marginBottom: 7 },
  fieldLabel: { fontSize: 7.5, letterSpacing: 1.2, color: 'rgba(120,90,46,0.7)', fontWeight: '700' },
  fieldValue: { fontSize: 13, color: INK2, marginTop: 1 },
  mono: { fontFamily: 'monospace', fontWeight: '800', color: INK, fontSize: 14, letterSpacing: 0.5 },
  verified: { color: '#1F6B3B', fontWeight: '800', fontSize: 12, marginTop: 1 },
  fullName: { fontSize: 18, fontWeight: '700', color: INK, marginTop: 1 },
  divider: { height: 1, backgroundColor: 'rgba(138,106,58,0.3)', marginTop: 12 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  smallVal: { fontSize: 11.5, color: INK2, marginTop: 1 },
  qrBox: { width: 72, height: 72, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' },
  scan: { fontSize: 6.5, letterSpacing: 1, color: 'rgba(120,90,46,0.6)', marginTop: 3, fontWeight: '700' },
  signature: { height: 46, width: 160 },
  mrzBand: { backgroundColor: '#0F1A2E', paddingHorizontal: 16, paddingVertical: 12 },
  mrz: { fontFamily: 'monospace', fontSize: 10.5, letterSpacing: 1, lineHeight: 17, color: 'rgba(90,220,150,0.9)', textAlign: 'center' },
  footBand: { alignItems: 'center', paddingVertical: 8 },
  footTxt: { color: 'rgba(241,200,120,0.7)', fontSize: 7.5, letterSpacing: 2, fontWeight: '600' },
  note: { color: C.txt3, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 16 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 34 },
  emptyIcon: { width: 84, height: 84, borderRadius: 24, backgroundColor: '#0A3A3D', borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.txt, textAlign: 'center', marginBottom: 10 },
  emptyText: { color: C.txt2, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
