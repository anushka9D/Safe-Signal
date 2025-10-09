
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

export default function Settings() {
  return (
    <SafeAreaView className="flex-1 bg-[#0b1220] p-5">
      <Text className="text-white text-xl font-bold">Settings</Text>
    </SafeAreaView>
  );
}
