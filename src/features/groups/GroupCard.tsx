import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Avatar, VerifiedBadge } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { colors, radius, universeColors } from '@/src/theme/tokens';
import { fmtTime } from '@/src/lib/tz';
import type { GroupCardData } from './api';
import { localeOf, relativeStart } from './time';

export function GroupCard({ group }: { group: GroupCardData }) {
  const router = useRouter();
  const { t, lang } = useI18n();
  const u = universeColors[group.universe];
  const count = group.members.length;
  const tag = group.subcategory
    ? `${t(`universes.${group.universe}`)} · ${t(`sports.${group.subcategory}`)}`
    : t(`universes.${group.universe}`);
  const time = fmtTime(group.starts_at, localeOf(lang));

  let action: { label: string; bg: string } | null = null;
  if (group.myStatus === 'pending') action = { label: t('group.pending'), bg: colors.sand };
  else if (group.myStatus === 'accepted') action = { label: t('group.accepted'), bg: colors.lime };
  else if (group.status === 'full') action = { label: t('group.full'), bg: colors.line };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${group.title}, ${relativeStart(group.starts_at, t, lang)}, ${group.place_name}`}
      onPress={() => router.push({ pathname: '/groupe/[id]', params: { id: group.id } })}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }]}
    >
      <View style={[styles.band, { backgroundColor: u.bg }]}>
        <View style={styles.bandTop}>
          <AppText variant="tag" color={u.fg} style={{ flex: 1 }} numberOfLines={1}>
            {tag.toUpperCase()}
          </AppText>
          <AppText variant="tag" color={u.fg}>⏱ {relativeStart(group.starts_at, t, lang)}</AppText>
        </View>
        <AppText variant="heading" color={u.fg} numberOfLines={2} style={{ fontSize: 22, lineHeight: 26 }}>
          {group.title}
        </AppText>
        {group.level ? (
          <View style={styles.level}>
            <AppText variant="tag">{t('explore.level', { level: group.level })}</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <AppText variant="small" color={colors.sub} style={{ flex: 1 }} numberOfLines={1}>
            {time} · {group.place_name}
            {group.budget ? ` · ${group.budget}` : ''}
          </AppText>
          <View style={styles.stack}>
            {group.members.slice(0, 3).map((m, i) => (
              <View key={m.id} style={{ marginLeft: i ? -8 : 0 }}>
                <Avatar name={m.first_name} uri={m.photo} seed={m.id} size={26} ring />
              </View>
            ))}
            <AppText variant="label" style={{ marginLeft: 6 }}>
              {t('explore.places', { n: count, total: group.capacity })}
            </AppText>
          </View>
        </View>

        {group.women_only ? (
          <AppText variant="tag" color={colors.coralDark}>♀ {t('explore.womenOnly').toUpperCase()}</AppText>
        ) : null}

        <View style={styles.row}>
          {group.organizer ? (
            <View style={[styles.organizer, { minWidth: 0 }]}>
              <Avatar name={group.organizer.first_name} uri={group.organizer.photo} seed={group.organizer.id} size={36} />
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <AppText variant="label">{group.organizer.first_name}</AppText>
                  {group.organizer.verification_status === 'verified' ? <VerifiedBadge size={14} /> : null}
                </View>
                <AppText variant="small" color={colors.sub} numberOfLines={1}>
                  {group.organizer.rating_count ? `${Number(group.organizer.rating_avg).toFixed(1)} ★ · ` : ''}
                  {t('group.organizer')}
                </AppText>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {action ? (
            <View style={[styles.action, { backgroundColor: action.bg }]}>
              <AppText variant="label">{action.label}</AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl, overflow: 'hidden' },
  band: { padding: 16, gap: 6 },
  bandTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  level: {
    alignSelf: 'flex-end', backgroundColor: colors.lime, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, transform: [{ rotate: '-4deg' }], marginTop: -4,
  },
  body: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stack: { flexDirection: 'row', alignItems: 'center' },
  organizer: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  action: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.pill, justifyContent: 'center' },
});
