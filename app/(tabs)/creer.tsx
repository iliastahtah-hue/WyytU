import { ComingSoon } from '@/src/components/ComingSoon';
import { useI18n } from '@/src/i18n';
import { img3d } from '@/src/theme/images';

export default function Screen() {
  const { t } = useI18n();
  return <ComingSoon title={t('tabs.create')} icon={img3d.sparkles} />;
}
