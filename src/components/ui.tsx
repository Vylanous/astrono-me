import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';

// Palette taken exactly from the ASTRONO-ME brief site (astrocan.manus.space/app.css):
// --navy #12213A, --gold #D4A94E, --gold-light #E9D49B, --paper #F5F1E8,
// --ink #1D2734, --muted #66707D, --line #D9D4C8, --teal #49736D, --rose #A35F5C.
export const colors = {
  ink: '#1D2734',
  softInk: '#66707D',
  muted: '#66707D',
  paper: '#F5F1E8',
  card: '#FBF9F4',
  line: '#D9D4C8',
  accent: '#12213A',
  navy: '#12213A',
  accentSoft: '#F3E9D2',
  gold: '#D4A94E',
  goldLight: '#E9D49B',
  teal: '#49736D',
  rose: '#A35F5C',
  danger: '#A35F5C',
};

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <ScrollView style={[styles.screen, style]} contentContainerStyle={styles.screenContent}>
      {children}
    </ScrollView>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Sub({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sub}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'quiet' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'quiet' && styles.buttonQuiet,
        variant === 'danger' && styles.buttonDanger,
        (pressed || disabled) && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' && styles.buttonTextPrimary,
          variant === 'danger' && styles.buttonTextDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The calm locked state shown on Premium screens for free users.
 * States plainly what Premium includes and what it costs, with one
 * button to the paywall. No countdowns, no pressure copy.
 */
export function LockedState({
  feature,
  includes,
}: {
  feature: string;
  includes: string[];
}) {
  const router = useRouter();
  return (
    <Card>
      <SectionTitle>{feature} is part of ASTRONO-ME Premium</SectionTitle>
      <Body>
        Premium includes:
      </Body>
      {includes.map((line) => (
        <Text key={line} style={styles.bullet}>
          {'·  '}
          {line}
        </Text>
      ))}
      <Body style={{ marginTop: 10 }}>
        CA$7.99 per month, or CA$69.99 per year. You can cancel at any time in your store
        subscription settings, and the free daily reading stays free either way.
      </Body>
      <Button label="See Premium and prices" onPress={() => router.push('/paywall')} />
    </Card>
  );
}

export function PromptBlock({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.prompt}>
      <Text style={styles.promptLabel}>For reflection</Text>
      <Text style={styles.promptText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  screenContent: { padding: 20, paddingBottom: 48, gap: 14 },
  title: { fontSize: 28, fontWeight: '600', color: colors.ink, lineHeight: 34 },
  sub: { fontSize: 15, color: colors.softInk, lineHeight: 21 },
  body: { fontSize: 16, color: colors.ink, lineHeight: 24 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.ink, lineHeight: 24 },
  bullet: { fontSize: 16, color: colors.ink, lineHeight: 23, paddingLeft: 4 },
  button: {
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  buttonPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  buttonQuiet: { backgroundColor: colors.card },
  buttonDanger: { borderColor: colors.danger, backgroundColor: colors.card },
  buttonPressed: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '600', color: colors.ink },
  buttonTextPrimary: { color: '#FFFFFF' },
  buttonTextDanger: { color: colors.danger },
  prompt: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  promptText: { fontSize: 16, fontStyle: 'italic', color: colors.ink, lineHeight: 23 },
});
