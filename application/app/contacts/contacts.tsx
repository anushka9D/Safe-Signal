import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, Linking, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';


const CONTACTS = [

    { label: "Fire Brigade", number: "+94754562615" },
    { label: "Personal", number: "+94726221723" },
];

export default function Contacts() {
    const router = useRouter();

    const sanitizePhone = (raw: string) => {

        const trimmed = raw.trim();
        const hasPlus = trimmed.startsWith("+");
        const digits = trimmed.replace(/[^\d]/g, "");
        return hasPlus ? `+${digits}` : digits;
    };

    const handleCall = async (rawPhone: string) => {
        const phone = sanitizePhone(rawPhone);
        const scheme = Platform.OS === "ios" ? "telprompt:" : "tel:";
        const url = `${scheme}${phone}`;

        try {
            await Linking.openURL(url);
        } catch {

            try {
                await Linking.openURL(`tel:${phone}`);
            } catch {
                Alert.alert("Cannot place call", "Your device cannot open the dialer for this number.");
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View className="bg-white shadow-sm px-6 py-4 pt-12">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        className="bg-gray-100 rounded-full p-2 mt-8"
                        onPress={() => router.back()}
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="arrow-back" size={24} color="#4B5563" />
                    </TouchableOpacity>

                    <Text className="text-2xl font-bold text-gray-800 mt-8">Emergency Contacts</Text>
                    <View className="w-10" />
                </View>
            </View>

            {/* Contact list */}
            <View className="px-6 pt-4 space-y-3">
                {CONTACTS.map((c) => (
                    <View
                        key={c.number}
                        className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3"
                    >
                        <View>
                            <Text className="text-gray-800 font-semibold">{c.label}</Text>


                            <TouchableOpacity onPress={() => handleCall(c.number)} accessibilityRole="button">
                                <Text className="text-blue-600 mt-0.5 underline">{c.number}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => handleCall(c.number)}
                            className="bg-green-100 rounded-full p-3"
                            accessibilityLabel={`Call ${c.label}`}
                        >
                            <Ionicons name="call" size={22} color="#16a34a" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </SafeAreaView>
    );
}
