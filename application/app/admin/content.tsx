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
  Image,
  Modal
} from 'react-native';
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase-config';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dweg4sz3l';
const CLOUDINARY_UPLOAD_PRESET = 'safesignal';

interface ArticleParagraph {
  id: string;
  text: string;
  imageUrl?: string;
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
  cloudinaryPublicIds: string[];
  createdAt: any;
  updatedAt: any;
  isPublished: boolean;
  views: number;
  likes: number;
}

export default function Content() {
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [disasterTypes, setDisasterTypes] = useState<string[]>([]);
  const [knowledgeLevels, setKnowledgeLevels] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [paragraphs, setParagraphs] = useState<ArticleParagraph[]>([
    { id: '1', text: '', imageUrl: '' }
  ]);
  const [cloudinaryPublicIds, setCloudinaryPublicIds] = useState<string[]>([]);
  const [readTime, setReadTime] = useState(5);

  const categories = ['Preparation', 'Response', 'Recovery', 'Prevention', 'Education', 'Safety'];
  const disasterTypeOptions = ['earthquake', 'flood', 'storm', 'landslide', 'common'];
  const knowledgeLevelOptions = ['beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    loadArticles();
  }, []);

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setCategory('');
    setDisasterTypes([]);
    setKnowledgeLevels([]);
    setTags('');
    setHeaderImageUrl('');
    setSummary('');
    setParagraphs([{ id: '1', text: '', imageUrl: '' }]);
    setCloudinaryPublicIds([]);
    setReadTime(5);
    setShowAddForm(false);
    setEditingArticle(null);
  };

  const uploadImageToCloudinary = async (uri: string): Promise<{ url: string; publicId: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'articles');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      return { url: data.secure_url, publicId: data.public_id };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  const pickHeaderImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUploading(true);
        try {
          const uploadResult = await uploadImageToCloudinary(result.assets[0].uri);
          setHeaderImageUrl(uploadResult.url);
          setCloudinaryPublicIds([...cloudinaryPublicIds, uploadResult.publicId]);
          Alert.alert('Success', 'Header image uploaded!');
        } catch (error) {
          Alert.alert('Error', 'Failed to upload header image');
        } finally {
          setImageUploading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickParagraphImage = async (paragraphId: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUploading(true);
        try {
          const uploadResult = await uploadImageToCloudinary(result.assets[0].uri);
          setParagraphs(paragraphs.map(p => 
            p.id === paragraphId ? { ...p, imageUrl: uploadResult.url } : p
          ));
          setCloudinaryPublicIds([...cloudinaryPublicIds, uploadResult.publicId]);
          Alert.alert('Success', 'Image uploaded!');
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image');
        } finally {
          setImageUploading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const addParagraph = () => {
    setParagraphs([...paragraphs, { 
      id: Date.now().toString(), 
      text: '', 
      imageUrl: '' 
    }]);
  };

  const removeParagraph = (paragraphId: string) => {
    if (paragraphs.length > 1) {
      setParagraphs(paragraphs.filter(p => p.id !== paragraphId));
    }
  };

  const updateParagraphText = (paragraphId: string, text: string) => {
    setParagraphs(paragraphs.map(p => 
      p.id === paragraphId ? { ...p, text } : p
    ));
  };

  const toggleDisasterType = (type: string) => {
    if (disasterTypes.includes(type)) {
      setDisasterTypes(disasterTypes.filter(t => t !== type));
    } else {
      setDisasterTypes([...disasterTypes, type]);
    }
  };

  const toggleKnowledgeLevel = (level: string) => {
    if (knowledgeLevels.includes(level)) {
      setKnowledgeLevels(knowledgeLevels.filter(l => l !== level));
    } else {
      setKnowledgeLevels([...knowledgeLevels, level]);
    }
  };

  const calculateReadTime = () => {
    const totalWords = paragraphs.reduce((total, p) => {
      return total + p.text.split(/\s+/).length;
    }, 0);
    const estimatedTime = Math.max(1, Math.ceil(totalWords / 200));
    setReadTime(estimatedTime);
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
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
    if (disasterTypes.length === 0) {
      Alert.alert('Validation Error', 'Select at least one disaster type');
      return false;
    }
    if (knowledgeLevels.length === 0) {
      Alert.alert('Validation Error', 'Select at least one knowledge level');
      return false;
    }
    if (!headerImageUrl) {
      Alert.alert('Validation Error', 'Header image is required');
      return false;
    }
    if (paragraphs.filter(p => p.text.trim()).length === 0) {
      Alert.alert('Validation Error', 'Add at least one paragraph');
      return false;
    }
    return true;
  };

  const saveArticle = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      calculateReadTime();
      
      const articleData = {
        title: title.trim(),
        headerImageUrl,
        paragraphs: paragraphs.filter(p => p.text.trim()).map(p => ({
          text: p.text.trim(),
          imageUrl: p.imageUrl || null
        })),
        author: author.trim(),
        category,
        disasterType: disasterTypes,
        knowledgeLevel: knowledgeLevels,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        summary: summary.trim() || paragraphs[0]?.text.substring(0, 150) + '...',
        readTime,
        cloudinaryPublicIds,
        updatedAt: serverTimestamp(),
        isPublished: true,
        views: editingArticle?.views || 0,
        likes: editingArticle?.likes || 0
      };

      if (editingArticle) {
        await updateDoc(doc(db, 'articles', editingArticle.id), articleData);
        Alert.alert('Success', 'Article updated successfully!');
      } else {
        await addDoc(collection(db, 'articles'), {
          ...articleData,
          createdAt: serverTimestamp()
        });
        Alert.alert('Success', 'Article published successfully!');
      }
      
      resetForm();
      loadArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      Alert.alert('Error', 'Failed to save article');
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
      } as Article));
      setArticles(articlesList);
    } catch (error) {
      console.error('Error loading articles:', error);
      Alert.alert('Error', 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const editArticle = (article: Article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setAuthor(article.author);
    setCategory(article.category);
    setDisasterTypes(article.disasterType || []);
    setKnowledgeLevels(article.knowledgeLevel || []);
    setTags(article.tags?.join(', ') || '');
    setHeaderImageUrl(article.headerImageUrl);
    setSummary(article.summary);
    setParagraphs(article.paragraphs.map((p, idx) => ({
      id: idx.toString(),
      text: p.text,
      imageUrl: p.imageUrl || ''
    })));
    setCloudinaryPublicIds(article.cloudinaryPublicIds || []);
    setReadTime(article.readTime || 5);
    setShowAddForm(true);
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

  const previewArticleHandler = (article: Article) => {
    setPreviewArticle(article);
    setShowPreview(true);
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
                <Ionicons name="refresh" size={20} color="white" />
              </Pressable>
              <Pressable
                onPress={() => {
                  if (showAddForm) resetForm();
                  else setShowAddForm(true);
                }}
                className="bg-orange-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">
                  {showAddForm ? 'Cancel' : '+ New Article'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Add/Edit Article Form */}
          {showAddForm && (
            <View className="bg-white/10 rounded-xl p-4 mb-6">
              <Text className="text-white text-xl font-bold mb-4">
                {editingArticle ? 'Edit Article' : 'Create New Article'}
              </Text>

              {/* Title */}
              <Text className="text-white mb-2 font-semibold">Article Title *</Text>
              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-4"
                placeholder="Enter article title"
                placeholderTextColor="#cbd5e1"
                value={title}
                onChangeText={setTitle}
                multiline
              />

              {/* Author */}
              <Text className="text-white mb-2 font-semibold">Author Name *</Text>
              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-4"
                placeholder="Enter author name"
                placeholderTextColor="#cbd5e1"
                value={author}
                onChangeText={setAuthor}
              />

              {/* Category */}
              <Text className="text-white mb-2 font-semibold">Category *</Text>
              <View className="bg-white/10 border border-white/15 rounded-xl mb-4">
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={{ color: 'white' }}
                  dropdownIconColor="white"
                >
                  <Picker.Item label="Select category..." value="" />
                  {categories.map(cat => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>

              {/* Disaster Types */}
              <Text className="text-white mb-2 font-semibold">Disaster Types * (Select all that apply)</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {disasterTypeOptions.map(type => (
                  <Pressable
                    key={type}
                    onPress={() => toggleDisasterType(type)}
                    className={`px-3 py-2 rounded-lg border ${
                      disasterTypes.includes(type)
                        ? 'bg-orange-500 border-orange-500'
                        : 'bg-white/10 border-white/15'
                    }`}
                  >
                    <Text className="text-white text-sm font-semibold capitalize">
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Knowledge Levels */}
              <Text className="text-white mb-2 font-semibold">Knowledge Levels * (Target audience)</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {knowledgeLevelOptions.map(level => (
                  <Pressable
                    key={level}
                    onPress={() => toggleKnowledgeLevel(level)}
                    className={`px-3 py-2 rounded-lg border ${
                      knowledgeLevels.includes(level)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white/10 border-white/15'
                    }`}
                  >
                    <Text className="text-white text-sm font-semibold capitalize">
                      {level}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Tags */}
              <Text className="text-white mb-2 font-semibold">Tags (comma separated)</Text>
              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-4"
                placeholder="e.g., safety, preparation, emergency"
                placeholderTextColor="#cbd5e1"
                value={tags}
                onChangeText={setTags}
              />

              {/* Header Image */}
              <Text className="text-white mb-2 font-semibold">Header Image *</Text>
              <Pressable
                onPress={pickHeaderImage}
                disabled={imageUploading}
                className={`border border-white/15 rounded-xl px-4 py-3 flex-row items-center justify-center mb-2 ${
                  imageUploading ? 'bg-white/5' : 'bg-white/10'
                }`}
              >
                {imageUploading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={20} color="white" />
                    <Text className="text-white ml-2">
                      {headerImageUrl ? 'Change Header Image' : 'Upload Header Image'}
                    </Text>
                  </>
                )}
              </Pressable>
              {headerImageUrl && (
                <Image
                  source={{ uri: headerImageUrl }}
                  className="w-full h-40 rounded-lg mb-4"
                  resizeMode="cover"
                />
              )}

              {/* Summary */}
              <Text className="text-white mb-2 font-semibold">Summary (optional)</Text>
              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-4"
                placeholder="Brief summary of the article..."
                placeholderTextColor="#cbd5e1"
                value={summary}
                onChangeText={setSummary}
                multiline
                numberOfLines={3}
              />

              {/* Paragraphs */}
              <Text className="text-white mb-2 font-semibold text-lg">Article Content *</Text>
              {paragraphs.map((paragraph, index) => (
                <View key={paragraph.id} className="bg-white/5 rounded-xl p-3 mb-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white font-semibold">Paragraph {index + 1}</Text>
                    {paragraphs.length > 1 && (
                      <Pressable
                        onPress={() => removeParagraph(paragraph.id)}
                        className="bg-red-500/20 px-2 py-1 rounded"
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>
                  
                  <TextInput
                    className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-2"
                    placeholder="Write your paragraph here..."
                    placeholderTextColor="#cbd5e1"
                    value={paragraph.text}
                    onChangeText={(text) => updateParagraphText(paragraph.id, text)}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />

                  <Pressable
                    onPress={() => pickParagraphImage(paragraph.id)}
                    disabled={imageUploading}
                    className="border border-white/15 rounded-xl px-3 py-2 flex-row items-center justify-center bg-white/10"
                  >
                    <Ionicons name="image-outline" size={16} color="white" />
                    <Text className="text-white text-sm ml-2">
                      {paragraph.imageUrl ? 'Change Image' : 'Add Image (optional)'}
                    </Text>
                  </Pressable>

                  {paragraph.imageUrl && (
                    <Image
                      source={{ uri: paragraph.imageUrl }}
                      className="w-full h-32 rounded-lg mt-2"
                      resizeMode="cover"
                    />
                  )}
                </View>
              ))}

              <Pressable
                onPress={addParagraph}
                className="bg-white/10 border border-dashed border-white/30 rounded-xl px-4 py-3 flex-row items-center justify-center mb-4"
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white ml-2 font-semibold">Add Another Paragraph</Text>
              </Pressable>

              {/* Read Time Calculator */}
              <Pressable
                onPress={calculateReadTime}
                className="bg-blue-500/20 px-4 py-2 rounded-lg mb-4"
              >
                <Text className="text-blue-300 text-center">
                  Estimated Read Time: {readTime} min
                </Text>
              </Pressable>

              {/* Submit Button */}
              <Pressable
                onPress={saveArticle}
                disabled={loading || imageUploading}
                className={`rounded-xl px-4 py-3 items-center ${
                  loading || imageUploading ? 'bg-orange-500/60' : 'bg-orange-500'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-extrabold">
                    {editingArticle ? 'Update Article' : 'Publish Article'}
                  </Text>
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
                  No articles yet. Click "+ New Article" to create one.
                </Text>
              </View>
            ) : (
              articles.map((article) => (
                <View key={article.id} className="bg-white/10 rounded-xl p-4 mb-4">
                  <View className="flex-row">
                    {article.headerImageUrl && (
                      <Image
                        source={{ uri: article.headerImageUrl }}
                        className="w-24 h-24 rounded-lg mr-3"
                        resizeMode="cover"
                      />
                    )}
                    <View className="flex-1">
                      <Text className="text-white font-bold text-lg mb-1">
                        {article.title}
                      </Text>
                      <Text className="text-gray-300 text-sm mb-2">
                        By {article.author} • {article.category}
                      </Text>
                      <View className="flex-row flex-wrap gap-1 mb-2">
                        {article.disasterType?.map(type => (
                          <View key={type} className="bg-orange-500/30 px-2 py-1 rounded">
                            <Text className="text-orange-300 text-xs capitalize">{type}</Text>
                          </View>
                        ))}
                      </View>
                      <View className="flex-row flex-wrap gap-1">
                        {article.knowledgeLevel?.map(level => (
                          <View key={level} className="bg-blue-500/30 px-2 py-1 rounded">
                            <Text className="text-blue-300 text-xs capitalize">{level}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-white/10">
                    <View className="flex-row gap-3">
                      <Text className="text-gray-400 text-xs">
                        📖 {article.readTime || 5} min
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        👁️ {article.views || 0}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        ❤️ {article.likes || 0}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => previewArticleHandler(article)}
                        className="bg-blue-500/20 px-3 py-1 rounded-lg"
                      >
                        <Text className="text-blue-400 text-sm font-semibold">Preview</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => editArticle(article)}
                        className="bg-green-500/20 px-3 py-1 rounded-lg"
                      >
                        <Text className="text-green-400 text-sm font-semibold">Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => deleteArticle(article.id)}
                        className="bg-red-500/20 px-3 py-1 rounded-lg"
                      >
                        <Text className="text-red-400 text-sm font-semibold">Delete</Text>
                      </Pressable>
                    </View>
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

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold">Article Preview</Text>
            <Pressable onPress={() => setShowPreview(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </Pressable>
          </View>
          
          <ScrollView className="flex-1">
            {previewArticle && (
              <>
                {previewArticle.headerImageUrl && (
                  <Image
                    source={{ uri: previewArticle.headerImageUrl }}
                    className="w-full h-64"
                    resizeMode="cover"
                  />
                )}
                <View className="p-6">
                  <Text className="text-3xl font-bold text-gray-900 mb-4">
                    {previewArticle.title}
                  </Text>
                  <View className="flex-row items-center mb-6">
                    <Text className="text-gray-600">
                      By {previewArticle.author} • {previewArticle.readTime} min read
                    </Text>
                  </View>
                  {previewArticle.paragraphs?.map((para, idx) => (
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
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

