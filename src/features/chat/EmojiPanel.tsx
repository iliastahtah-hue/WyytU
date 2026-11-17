import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { colors, radius } from '@/src/theme/tokens';

const SETS: { icon: string; list: string }[] = [
  { icon: '😀', list: '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😋 😜 🤪 😎 🤩 🥳 😏 😌 😴 🤔 🤗 🤭 🫡 😬 🙄 😮 😲 🥹 😢 😭 😤 😡 🤯 😱 🥶 🥵 🤒 🤠 🤓 😇 🙃' },
  { icon: '👍', list: '👍 👎 👏 🙌 🤝 🙏 💪 👋 🤙 ✌️ 🤞 👌 🫶 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💯 🔥 ✨ ⭐ 🌟 💥 🎉 🎊 ✅ ❌ ⚡ 💤 👀 🫠' },
  { icon: '⚽', list: '⚽ 🎾 🏀 🏐 🏈 🥎 🏓 🏸 🥊 🏋️ 🧘 🏃 🚴 🏊 🏄 🥾 ⛰️ 🏕️ 🏆 🥇 🎯 🎲 ♟️ 🃏 🎮 🎳 🎬 🍿 🎤 🎧 🎶 🎨 📸' },
  { icon: '🍔', list: '🍔 🍕 🌮 🌯 🥙 🍟 🍗 🥗 🍣 🍜 🍝 🥘 🍲 🥐 🧇 🥞 🍳 🍰 🧁 🍩 🍪 🍫 🍦 🍉 🍓 🍊 🍋 ☕ 🍵 🧃 🥤 🧉' },
  { icon: '🚗', list: '🚗 🚕 🛵 🚲 🚌 🚆 ✈️ 🏖️ 🏝️ 🌅 🌄 🌙 ☀️ 🌧️ ⛈️ 🌈 📍 🗺️ 🕐 ⏰ 📅 🎟️ 💸 💰 🛍️ 🏠 🕌 🇲🇦' },
];

/** Panneau d'émojis sous la zone de saisie */
export function EmojiPanel({ onPick }: { onPick: (e: string) => void }) {
  const [tab, setTab] = useState(0);
  return (
    <View style={styles.panel}>
      <View style={styles.tabs}>
        {SETS.map((s, i) => (
          <Pressable key={s.icon} onPress={() => setTab(i)} style={[styles.tab, tab === i && { backgroundColor: colors.coralSoft }]}>
            <AppText style={{ fontSize: 20 }}>{s.icon}</AppText>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.grid} keyboardShouldPersistTaps="always">
        {SETS[tab].list.split(' ').map((e, i) => (
          <Pressable key={`${e}${i}`} onPress={() => onPick(e)} style={styles.cell} accessibilityLabel={e}>
            <AppText style={{ fontSize: 28, lineHeight: 34 }}>{e}</AppText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { height: 260, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line },
  tabs: { flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingTop: 8 },
  tab: { width: 44, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  cell: { width: '12.5%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
});
