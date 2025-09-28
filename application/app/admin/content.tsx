import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase-config';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// Cloudinary configuration - Replace with your actual values
const CLOUDINARY_CLOUD_NAME = 'dweg4sz3l';
const CLOUDINARY_UPLOAD_PRESET = 'safesignal';
const CLOUDINARY_API_KEY = '752669573695597';

export default function Content() {
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // Cloudinary URL
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState(''); // For deletion
  const [summary, setSummary] = useState('');

  const categories = ['Earthquakes', 'Floods', 'Fire', 'Medical', 'Security', 'Weather', 'General'];

  const resetForm = () => {
    setTitle('');
    setContent('');
    setAuthor('');
    setCategory('');
    setTags('');
    setImageUri('');
    setImageUrl('');
    setCloudinaryPublicId('');
    setSummary('');
    setShowAddForm(false);
  };

  const uploadImageToCloudinary = async (uri: string): Promise<{ url: string; publicId: string }> => {
    try {
      // Create form data
      const formData = new FormData();
      
      // Add the image file
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
      
      // Add upload preset (required for unsigned uploads)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      // Optional: Add folder organization
      formData.append('folder', 'articles');
      
      // Optional: Add context/tags
      formData.append('context', `uploaded_by=${auth.currentUser?.uid || 'anonymous'}`);
      formData.append('tags', 'article,mobile_upload');

      console.log('Uploading to Cloudinary...');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      console.log('Cloudinary upload successful:', data.secure_url);

      return {
        url: data.secure_url,
        publicId: data.public_id
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  const deleteImageFromCloudinary = async (publicId: string) => {
    try {
      // For image deletion, you'll need to implement server-side deletion
      // or use Cloudinary's Admin API with authentication
      // This is a placeholder - see implementation notes below
      console.log('Would delete image with public_id:', publicId);
      
      // You can call your backend API here to delete the image
      // const response = await fetch('your-backend/delete-image', {
      //   method: 'DELETE',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ publicId })
      // });
      
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        
        // Upload image to Cloudinary
        setImageUploading(true);
        try {
          const uploadResult = await uploadImageToCloudinary(result.assets[0].uri);
          setImageUrl(uploadResult.url);
          setCloudinaryPublicId(uploadResult.publicId);
          Alert.alert('Success', 'Image uploaded successfully!');
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image');
          console.error('Image upload error:', error);
          setImageUri(''); // Clear local URI if upload failed
        } finally {
          setImageUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return false;
    }
    if (!content.trim()) {
      Alert.alert('Validation Error', 'Content is required');
      return false;
    }
    if (!author.trim()) {
      Alert.alert('Validation Error', 'Author is required');
      return false;
    }
    if (!category) {
      Alert.alert('Validation Error', 'Category is required');
      return false;
    }
    return true;
  };

  const addArticle = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const articleData = {
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
        category: category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        summary: summary.trim() || content.substring(0, 150) + '...',
        imageUrl: imageUrl || null, // Cloudinary URL
        cloudinaryPublicId: cloudinaryPublicId || null, // For future deletion
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublished: true,
        views: 0,
        likes: 0
      };

      await addDoc(collection(db, 'articles'), articleData);
      Alert.alert('Success', 'Article added successfully!');
      resetForm();
      loadArticles();
    } catch (error) {
      console.error('Error adding article:', error);
      Alert.alert('Error', 'Failed to add article');
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      const articlesQuery = query(
        collection(db, 'articles'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(articlesQuery);
      const articlesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArticles(articlesList);
    } catch (error) {
      console.error('Error loading articles:', error);
      Alert.alert('Error', 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const deleteArticle = async (articleId: string) => {
    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const articleToDelete = articles.find(article => article.id === articleId);
              
              // Delete image from Cloudinary if it exists
              if (articleToDelete?.cloudinaryPublicId) {
                try {
                  await deleteImageFromCloudinary(articleToDelete.cloudinaryPublicId);
                } catch (imageError) {
                  console.error('Error deleting image:', imageError);
                  // Continue with article deletion even if image deletion fails
                }
              }
              
              // Delete article document
              await deleteDoc(doc(db, 'articles', articleId));
              Alert.alert('Success', 'Article deleted successfully');
              loadArticles();
            } catch (error) {
              console.error('Error deleting article:', error);
              Alert.alert('Error', 'Failed to delete article');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1 p-5" keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="flex-row mb-6 justify-end">
            <View className="flex-row gap-2">
              <Pressable
                onPress={loadArticles}
                className="bg-blue-500 px-4 py-2 rounded-lg"
                disabled={loading}
              >
                <Text className="text-white font-semibold">Refresh</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowAddForm(!showAddForm)}
                className="bg-orange-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">
                  {showAddForm ? 'Cancel' : 'Add Article'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Cloudinary Configuration Warning */}
          {(CLOUDINARY_CLOUD_NAME === 'dweg4sz3l') && showAddForm && (
            <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
              <Text className="text-red-300 font-semibold mb-2">⚠️ Configuration Required</Text>
              <Text className="text-red-200 text-sm">
                Please update the Cloudinary configuration constants at the top of this file with your actual Cloudinary credentials.
              </Text>
            </View>
          )}

          {/* Add Article Form */}
          {showAddForm && (
            <View className="bg-white/10 rounded-xl p-4 mb-6">
              <Text className="text-white text-lg font-bold mb-4">Add New Article</Text>

              {/* Title */}
              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-3"
                placeholder="Article Title"
                placeholderTextColor="#cbd5e1"
                value={title}
                onChangeText={setTitle}
                multiline
              />

              {/* Author */}
              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-3"
                placeholder="Author Name"
                placeholderTextColor="#cbd5e1"
                value={author}
                onChangeText={setAuthor}
              />

              {/* Category Selection */}
              <View className="mb-3">
                <Text className="text-white mb-2">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {categories.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        className={`px-3 py-2 rounded-lg border ${category === cat
                            ? 'bg-orange-500 border-orange-500'
                            : 'bg-white/10 border-white/15'
                          }`}
                      >
                        <Text className="text-white text-sm font-semibold">{cat}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Tags */}
              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-3"
                placeholder="Tags (comma separated)"
                placeholderTextColor="#cbd5e1"
                value={tags}
                onChangeText={setTags}
              />

              {/* Summary */}
              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-3"
                placeholder="Summary (optional - will auto-generate if empty)"
                placeholderTextColor="#cbd5e1"
                value={summary}
                onChangeText={setSummary}
                multiline
                numberOfLines={3}
              />

              {/* Image Picker */}
              <View className="mb-3">
                <Pressable
                  onPress={pickImage}
                  disabled={imageUploading}
                  className={`border border-white/15 rounded-xl px-4 py-3 flex-row items-center justify-center ${
                    imageUploading ? 'bg-white/5' : 'bg-white/10'
                  }`}
                >
                  {imageUploading ? (
                    <>
                      <ActivityIndicator size="small" color="white" />
                      <Text className="text-white ml-2">Uploading to Cloudinary...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={20} color="white" />
                      <Text className="text-white ml-2">
                        {imageUrl ? 'Change Image' : 'Pick Image'}
                      </Text>
                    </>
                  )}
                </Pressable>
                {(imageUri || imageUrl) && (
                  <Image
                    source={{ uri: imageUrl || imageUri }}
                    className="w-full h-32 rounded-lg mt-2"
                    resizeMode="cover"
                  />
                )}
              </View>

              {/* Content */}
              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-4"
                placeholder="Article Content"
                placeholderTextColor="#cbd5e1"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              {/* Submit Button */}
              <Pressable
                onPress={addArticle}
                disabled={loading || imageUploading}
                className={`rounded-xl px-4 py-3 items-center ${
                  loading || imageUploading ? 'bg-orange-500/60' : 'bg-orange-500'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-extrabold">Add Article</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Articles List */}
          <View>
            <Text className="text-white text-lg font-bold mb-4">
              Published Articles ({articles.length})
            </Text>

            {articles.length === 0 && !loading ? (
              <View className="bg-white/10 rounded-xl p-6 items-center">
                <Ionicons name="document-outline" size={48} color="#cbd5e1" />
                <Text className="text-white text-center mt-2">
                  No articles yet. Click "Add Article" to create your first article.
                </Text>
              </View>
            ) : (
              articles.map((article) => (
                <View key={article.id} className="bg-white/10 rounded-xl p-4 mb-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-white font-bold text-lg mb-1">
                        {article.title}
                      </Text>
                      <Text className="text-gray-300 text-sm mb-2">
                        By {article.author} • {article.category}
                      </Text>
                      <Text className="text-gray-400 text-sm" numberOfLines={2}>
                        {article.summary}
                      </Text>
                      {article.tags && article.tags.length > 0 && (
                        <Text className="text-gray-500 text-xs mt-2">
                          Tags: {article.tags.join(', ')}
                        </Text>
                      )}
                    </View>
                    {article.imageUrl && (
                      <Image
                        source={{ uri: article.imageUrl }}
                        className="w-16 h-16 rounded-lg"
                        resizeMode="cover"
                      />
                    )}
                  </View>

                  <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-white/10">
                    <View className="flex-row gap-4">
                      <Text className="text-gray-400 text-xs">
                        Views: {article.views || 0}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        Likes: {article.likes || 0}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => deleteArticle(article.id)}
                      className="bg-red-500/20 px-3 py-1 rounded-lg"
                    >
                      <Text className="text-red-400 text-sm font-semibold">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          {loading && articles.length === 0 && (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#f97316" />
              <Text className="text-white mt-2">Loading articles...</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}