import { Text, type TextProps, type TextStyle } from 'react-native';
import { useI18n } from '@/src/i18n';
import { colors, fonts } from '@/src/theme/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'small' | 'label' | 'tag';

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.8 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
  heading: { fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 19 },
  tag: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
};

type Props = TextProps & { variant?: Variant; color?: string; center?: boolean };

/** Texte de l'app : bonne police, couleur par défaut, sens de lecture darija. */
export function AppText({ variant = 'body', color = colors.ink, center, style, ...rest }: Props) {
  const { isRTL } = useI18n();
  return (
    <Text
      {...rest}
      style={[
        VARIANTS[variant],
        { color, writingDirection: isRTL ? 'rtl' : 'ltr', textAlign: center ? 'center' : isRTL ? 'right' : 'left' },
        style,
      ]}
    />
  );
}
