import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

type Props = TouchableOpacityProps & { title: string };

export function Button({ title, className, ...rest }: Props) {
  return (
    <TouchableOpacity
      {...rest}
      className={`bg-christmas-green py-3 rounded-xl ${className ?? ''}`}
      activeOpacity={0.8}
    >
      <Text className="text-center text-white font-semibold">{title}</Text>
    </TouchableOpacity>
  );
}

