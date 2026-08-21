import { View } from 'react-native';

type Props = {
  isAvailable: boolean;
  hasUpcomingBooking?: boolean;
  size?: number;
};

// Green = "disponible maintenant" is on, orange = off. A yellow ring around the dot means
// this person already has an upcoming confirmed booking/collaboration — visible at a glance
// in both Explorer and the map, per the actual product need: find someone free to shoot
// content with right now, wherever you are.
export function AvailabilityDot({ isAvailable, hasUpcomingBooking = false, size = 12 }: Props) {
  const dotColor = isAvailable ? '#2A9D6F' : '#E8963B';
  const ringSize = size + 6;

  return (
    <View
      style={{
        width: ringSize,
        height: ringSize,
        borderRadius: ringSize / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: hasUpcomingBooking ? 2 : 0,
        borderColor: '#FFC629',
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dotColor,
          borderWidth: 1.5,
          borderColor: '#FFFFFF',
        }}
      />
    </View>
  );
}
