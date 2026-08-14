import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from '@/theme/useTheme';

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode: 'date' | 'time';
  minimumDate?: Date;
};

function formatValue(value: Date | null, mode: 'date' | 'time') {
  if (!value) return mode === 'date' ? 'Choisir une date' : 'Choisir une heure';
  return mode === 'date'
    ? value.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : value.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function DateField({ label, value, onChange, mode, minimumDate }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const displayValue = value ?? new Date();

  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: displayValue,
      mode,
      minimumDate,
      onValueChange: (_event, date) => {
        if (date) onChange(date);
      },
    });
  };

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
      {Platform.OS === 'android' ? (
        <Pressable
          onPress={openAndroidPicker}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: spacing.md,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={[typography.body, { color: value ? colors.text : colors.textMuted }]}>
            {formatValue(value, mode)}
          </Text>
        </Pressable>
      ) : (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            backgroundColor: colors.surface,
            alignItems: 'flex-start',
          }}
        >
          <DateTimePicker
            value={displayValue}
            mode={mode}
            display={mode === 'date' ? 'compact' : 'compact'}
            minimumDate={minimumDate}
            onValueChange={(_event, date) => onChange(date)}
          />
        </View>
      )}
    </View>
  );
}
