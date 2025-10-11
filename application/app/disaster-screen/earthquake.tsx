import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, increment, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from '../../config/firebase-config';

interface ArticleParagraph {
    text: string;
    imageUrl?: string | null;
}

interface Article {
    id: string;
    title: string;
    headerImageUrl: string;
    paragraphs: ArticleParagraph[];
    author: string;
    category: string;
    disasterType: string[];
    knowledgeLevel: string[];
    tags: string[];
    summary: string;
    readTime: number;
    createdAt: any;
    updatedAt: any;
    isPublished: boolean;
    views: number;
    likes: number;
}

interface UserQuizData {
    knowledgeLevel: string;
    weakAreas: string[];
    strongAreas: string[];
    userRiskArea: string;
}

export default function Earthquake() {
    const router = useRouter();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [userQuizData, setUserQuizData] = useState<UserQuizData | null>(null);

    useEffect(() => {
        loadUserDataAndArticles();
    }, []);

    const loadUserDataAndArticles = async () => {
        try {
            setLoading(true);
            
            if (!auth.currentUser) {
                console.log('No user authenticated');
                return;
            }

            // Get user's quiz data
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const quizData: UserQuizData = {
                    knowledgeLevel: userData.knowledgeLevel || 'beginner',
                    weakAreas: userData.weakAreas || [],
                    strongAreas: userData.strongAreas || [],
                    userRiskArea: userData.userRiskArea || ''
                };
                setUserQuizData(quizData);
                
                // Load articles based on user's data
                await loadFilteredArticles(quizData);
            } else {
                console.log('User document not found');
                // Load default articles if no quiz data
                await loadDefaultArticles();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            await loadDefaultArticles();
        } finally {
            setLoading(false);
        }
    };

    const loadFilteredArticles = async (quizData: UserQuizData) => {
        try {
            // Query articles that match earthquake disaster type
            const articlesRef = collection(db, 'articles');
            const articlesQuery = query(
                articlesRef,
                where('disasterType', 'array-contains', 'earthquake'),
                where('isPublished', '==', true)
            );

            const snapshot = await getDocs(articlesQuery);
            let articlesList: Article[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                articlesList.push({
                    id: doc.id,
                    title: data.title,
                    headerImageUrl: data.headerImageUrl,
                    paragraphs: data.paragraphs || [],
                    author: data.author,
                    category: data.category,
                    disasterType: data.disasterType || [],
                    knowledgeLevel: data.knowledgeLevel || [],
                    tags: data.tags || [],
                    summary: data.summary,
                    readTime: data.readTime || 5,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    isPublished: data.isPublished,
                    views: data.views || 0,
                    likes: data.likes || 0
                });
            });

            // Filter and sort articles based on user's quiz data
            const filteredArticles = prioritizeArticles(articlesList, quizData);
                       
            // Limit to top 10 most relevant articles
            setArticles(filteredArticles.slice(0, 10));
            console.log(`Loaded ${filteredArticles.length} filtered articles`);
        } catch (error) {
            console.error('Error loading filtered articles:', error);
        }
    };

    const loadDefaultArticles = async () => {
        try {
            const articlesRef = collection(db, 'articles');
            const articlesQuery = query(
                articlesRef,
                where('disasterType', 'array-contains', 'earthquake'),
                where('isPublished', '==', true)
            );

            const snapshot = await getDocs(articlesQuery);
            const articlesList: Article[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                articlesList.push({
                    id: doc.id,
                    title: data.title,
                    headerImageUrl: data.headerImageUrl,
                    paragraphs: data.paragraphs || [],
                    author: data.author,
                    category: data.category,
                    disasterType: data.disasterType || [],
                    knowledgeLevel: data.knowledgeLevel || [],
                    tags: data.tags || [],
                    summary: data.summary,
                    readTime: data.readTime || 5,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    isPublished: data.isPublished,
                    views: data.views || 0,
                    likes: data.likes || 0
                });
            });

            setArticles(articlesList.slice(0, 10));
        } catch (error) {
            console.error('Error loading default articles:', error);
        }
    };

    const prioritizeArticles = (articlesList: Article[], quizData: UserQuizData): Article[] => {
        return articlesList
            .map(article => {
                let score = 0;

                // Prioritize articles matching user's knowledge level
                if (article.knowledgeLevel.includes(quizData.knowledgeLevel)) {
                    score += 10;
                }

                // Higher priority for weak areas (user needs to learn)
                const matchesWeakArea = article.disasterType.some(type => 
                    quizData.weakAreas.includes(type)
                );
                if (matchesWeakArea) {
                    score += 20;
                }

                // High priority if matches user's identified risk area
                if (quizData.userRiskArea && article.disasterType.includes(quizData.userRiskArea)) {
                    score += 15;
                }

                // Lower priority for strong areas (user already knows well)
                const matchesStrongArea = article.disasterType.some(type => 
                    quizData.strongAreas.includes(type)
                );
                if (matchesStrongArea) {
                    score += 5;
                }

                // Bonus for beginner level if user is beginner
                if (quizData.knowledgeLevel === 'beginner' && article.knowledgeLevel.includes('beginner')) {
                    score += 5;
                }

                return { ...article, relevanceScore: score };
            })
            .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
    };

    const openArticle = async (article: Article) => {
        setSelectedArticle(article);
        setShowArticleModal(true);

        // Increment view count
        try {
            const articleRef = doc(db, 'articles', article.id);
            await updateDoc(articleRef, {
                views: increment(1)
            });
            
            // Update local state
            setArticles(prevArticles =>
                prevArticles.map(a =>
                    a.id === article.id ? { ...a, views: a.views + 1 } : a
                )
            );
        } catch (error) {
            console.error('Error updating view count:', error);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Recently';
        
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            });
        } catch (error) {
            return 'Recently';
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Hero Header */}
                <View className="relative h-48">
                    <Image
                        source={require('../../assets/images/disasters/earthquake-damage-1.jpg')}
                        className="absolute inset-0 w-full h-full"
                        resizeMode="cover"
                    />

                    {/* Overlay */}
                    <View className="absolute inset-0 bg-black/40" />

                    {/* Header Content */}
                    <View className="absolute top-12 left-0 right-0 px-6 py-4 mt-8">
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity
                                className="bg-white/20 rounded-full p-2"
                                onPress={() => router.back()}
                            >
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                            <Text className="text-white text-3xl font-bold flex-1 text-center">
                                Earthquakes
                            </Text>
                            <View className="w-10" />
                        </View>
                    </View>
                </View>

                {/* Feature Articles */}
                <View className="px-4 mt-8 mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xl font-bold text-gray-800">
                            Recommended Articles
                        </Text>
                        {userQuizData && (
                            <View className="bg-blue-100 px-3 py-1 rounded-full">
                                <Text className="text-blue-700 text-xs font-semibold">
                                    Personalized
                                </Text>
                            </View>
                        )}
                    </View>

                    {loading ? (
                        <View className="items-center justify-center py-8">
                            <ActivityIndicator size="large" color="#3B82F6" />
                            <Text className="text-gray-600 mt-2">Loading articles...</Text>
                        </View>
                    ) : articles.length === 0 ? (
                        <View className="bg-gray-100 rounded-xl p-6 items-center">
                            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                            <Text className="text-gray-600 text-center mt-2">
                                No articles available at the moment.
                            </Text>
                        </View>
                    ) : (
                        <View className="space-y-4 gap-3">
                            {articles.map((article) => (
                                <TouchableOpacity
                                    key={article.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                                    onPress={() => openArticle(article)}
                                >
                                    <View className="flex-row">
                                        {/* Article Image */}
                                        <Image
                                            source={{ uri: article.headerImageUrl }}
                                            className="w-24 h-full"
                                            resizeMode="cover"
                                        />

                                        {/* Article Content */}
                                        <View className="flex-1 p-3">
                                            <Text className="font-semibold text-gray-800 text-sm leading-5 mb-2" numberOfLines={2}>
                                                {article.title}
                                            </Text>

                                            <View className="flex-row items-center mb-2">
                                                <View className="w-6 h-6 bg-orange-500 rounded-full mr-2 items-center justify-center">
                                                    <Text className="text-white text-xs font-bold">
                                                        {article.author.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-gray-600 text-xs">
                                                        {article.author}
                                                    </Text>
                                                    <Text className="text-gray-400 text-xs">
                                                        {formatDate(article.createdAt)}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View className="flex-row items-center flex-wrap gap-2">
                                                <View className="bg-blue-100 px-2 py-1 rounded">
                                                    <Text className="text-blue-700 text-xs">
                                                        {article.category}
                                                    </Text>
                                                </View>
                                                <Text className="text-gray-500 text-xs">
                                                    📖 {article.readTime} min
                                                </Text>
                                                <Text className="text-gray-500 text-xs">
                                                    👁️ {article.views}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Emergency Contacts */}
                <TouchableOpacity
                    className="bg-black mx-4 rounded-2xl p-4 mb-8"
                    onPress={() => router.push('/contacts/contacts')}
                >
                    <Text className="text-white text-xl font-bold text-center">
                        Emergency Contacts
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Article Modal */}
            <Modal
                visible={showArticleModal}
                animationType="slide"
                onRequestClose={() => setShowArticleModal(false)}
            >
                <SafeAreaView className="flex-1 bg-white">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                        <TouchableOpacity onPress={() => setShowArticleModal(false)}>
                            <Ionicons name="arrow-back" size={28} color="#000" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold">Article</Text>
                        <View className="w-7" />
                    </View>
                    
                    <ScrollView className="flex-1">
                        {selectedArticle && (
                            <>
                                {/* Header Image */}
                                {selectedArticle.headerImageUrl && (
                                    <Image
                                        source={{ uri: selectedArticle.headerImageUrl }}
                                        className="w-full h-64"
                                        resizeMode="cover"
                                    />
                                )}

                                <View className="p-6">
                                    {/* Category and Tags */}
                                    <View className="flex-row flex-wrap gap-2 mb-4">
                                        <View className="bg-blue-100 px-3 py-1 rounded-full">
                                            <Text className="text-blue-700 text-sm font-semibold">
                                                {selectedArticle.category}
                                            </Text>
                                        </View>
                                        {selectedArticle.knowledgeLevel.map((level, idx) => (
                                            <View key={idx} className="bg-green-100 px-3 py-1 rounded-full">
                                                <Text className="text-green-700 text-sm font-semibold capitalize">
                                                    {level}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Title */}
                                    <Text className="text-3xl font-bold text-gray-900 mb-4">
                                        {selectedArticle.title}
                                    </Text>

                                    {/* Author Info */}
                                    <View className="flex-row items-center mb-6 pb-4 border-b border-gray-200">
                                        <View className="w-12 h-12 bg-orange-500 rounded-full mr-3 items-center justify-center">
                                            <Text className="text-white text-xl font-bold">
                                                {selectedArticle.author.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-lg font-semibold text-gray-900">
                                                {selectedArticle.author}
                                            </Text>
                                            <View className="flex-row items-center gap-3">
                                                <Text className="text-sm text-gray-600">
                                                    {formatDate(selectedArticle.createdAt)}
                                                </Text>
                                                <Text className="text-sm text-gray-600">
                                                    📖 {selectedArticle.readTime} min read
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Summary */}
                                    {selectedArticle.summary && (
                                        <View className="bg-gray-50 p-4 rounded-lg mb-6">
                                            <Text className="text-gray-700 text-base leading-relaxed italic">
                                                {selectedArticle.summary}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Article Content */}
                                    {selectedArticle.paragraphs?.map((para, idx) => (
                                        <View key={idx} className="mb-6">
                                            <Text className="text-lg text-gray-700 leading-relaxed mb-4">
                                                {para.text}
                                            </Text>
                                            {para.imageUrl && (
                                                <Image
                                                    source={{ uri: para.imageUrl }}
                                                    className="w-full h-48 rounded-lg"
                                                    resizeMode="cover"
                                                />
                                            )}
                                        </View>
                                    ))}

                                    {/* Tags */}
                                    {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                                        <View className="mt-4 pt-4 border-t border-gray-200">
                                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                                Tags:
                                            </Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {selectedArticle.tags.map((tag, idx) => (
                                                    <View key={idx} className="bg-gray-200 px-3 py-1 rounded-full">
                                                        <Text className="text-gray-700 text-sm">
                                                            #{tag}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Article Stats */}
                                    <View className="mt-6 pt-4 border-t border-gray-200 flex-row justify-around">
                                        <View className="items-center">
                                            <Text className="text-2xl font-bold text-gray-900">
                                                {selectedArticle.views}
                                            </Text>
                                            <Text className="text-sm text-gray-600">Views</Text>
                                        </View>
                                        <View className="items-center">
                                            <Text className="text-2xl font-bold text-gray-900">
                                                {selectedArticle.likes}
                                            </Text>
                                            <Text className="text-sm text-gray-600">Likes</Text>
                                        </View>
                                        <View className="items-center">
                                            <Text className="text-2xl font-bold text-gray-900">
                                                {selectedArticle.readTime}
                                            </Text>
                                            <Text className="text-sm text-gray-600">Min Read</Text>
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}