import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';

type Props = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void | Promise<any>;
  disabled?: boolean;
  theme?: 'primary' | 'secondary';
};

export default function AppButton({
  title,
  icon,
  onPress,
  disabled = false,
  theme = 'primary',
}: Props) {
  const isPrimary = theme === 'primary';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={isPrimary ? COLORS.textOnPrimary : COLORS.primary}
          style={styles.icon}
        />
      )}

      <Text
        style={[
          styles.text,
          isPrimary ? styles.primaryText : styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  primary: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  secondary: {
    backgroundColor: COLORS.surface,
  },

  disabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.8,
  },

  icon: {
    marginRight: 8,
  },

  text: {
    fontSize: 16,
    fontWeight: '600',
  },

  primaryText: {
    color: COLORS.textOnPrimary,
  },

  secondaryText: {
    color: COLORS.primary,
  },
});
