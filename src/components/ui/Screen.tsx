import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '@/src/theme/tokens';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  bg?: string;
  edges?: Edge[];
  contentStyle?: ViewStyle;
};

/** Écran de base : zone sûre, fond, défilement et pied de page collé en bas. */
export function Screen({ children, scroll, footer, bg = colors.bg, edges = ['top', 'bottom'], contentStyle }: Props) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: bg }]} edges={edges}>
      {/* Android en plein écran (edge-to-edge) ne redimensionne plus la fenêtre : padding partout */}
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10 },
});
