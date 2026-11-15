import { Image } from 'expo-image';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { AppText, Button, Screen, StepHeader } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { img3d } from '@/src/theme/images';
import { colors, radius } from '@/src/theme/tokens';

function PermissionCard(props: {
  icon: ImageSourcePropType;
  title: string;
  body: string;
  granted: boolean;
  onAllow: () => void;
  allowLabel: string;
  allowedLabel: string;
}) {
  return (
    <View style={styles.card}>
      <Image source={props.icon} style={{ width: 56, height: 56 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="heading">{props.title}</AppText>
        <AppText variant="small" color={colors.sub}>{props.body}</AppText>
        <Button
          small
          kind={props.granted ? 'lime' : 'dark'}
          label={props.granted ? `✓ ${props.allowedLabel}` : props.allowLabel}
          onPress={props.onAllow}
          disabled={props.granted}
          style={{ alignSelf: 'flex-start', marginTop: 8 }}
        />
      </View>
    </View>
  );
}

export default function AutorisationsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { markPermissionsDone } = useOnboarding();
  const [loc, setLoc] = useState(false);
  const [notif, setNotif] = useState(false);

  const finish = async () => {
    await markPermissionsDone();
    router.replace('/');
  };

  return (
    <Screen
      scroll
      footer={
        <>
          <Button label={t('permissions.finish')} onPress={finish} />
          {!loc || !notif ? <Button label={t('common.later')} kind="ghost" onPress={finish} /> : null}
        </>
      }
    >
      <StepHeader step={5} total={5} />
      <AppText variant="title" style={{ marginBottom: 20 }}>{t('permissions.title')}</AppText>
      <View style={{ gap: 12 }}>
        <PermissionCard
          icon={img3d.phone}
          title={t('permissions.locTitle')}
          body={t('permissions.locBody')}
          granted={loc}
          allowLabel={t('permissions.allow')}
          allowedLabel={t('permissions.allowed')}
          onAllow={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLoc(status === 'granted');
          }}
        />
        <PermissionCard
          icon={img3d.speech}
          title={t('permissions.notifTitle')}
          body={t('permissions.notifBody')}
          granted={notif}
          allowLabel={t('permissions.allow')}
          allowedLabel={t('permissions.allowed')}
          onAllow={async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            setNotif(status === 'granted');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 14, padding: 18, borderRadius: radius.lg, backgroundColor: colors.card },
});
