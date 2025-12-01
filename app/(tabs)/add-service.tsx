import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Alert, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  Modal,
  FlatList,
  BackHandler 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from './../firebase'; 
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CATEGORIES = [
  { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
  { id: 'childcare', name: 'Child Care', icon: '👶' },
  { id: 'eldercare', name: 'Elder Care', icon: '👴' },
  { id: 'cooking', name: 'Cooking', icon: '👩‍🍳' },
  { id: 'maintenance', name: 'Maintenance', icon: '🔧' },
  { id: 'gardening', name: 'Gardening', icon: '🌱' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddServiceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // UI State
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Form State
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [hours, setHours] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/(tabs)/profile');
        return true; 
      };

      
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkUserPermissions(currentUser.uid);
      } else {
        Alert.alert("Access Denied", "Please log in to list a service.");
        router.replace('/');
      }
    });
    return unsubscribe;
  }, []);

  const checkUserPermissions = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.accountType === 'service_provider') {
          setInitializing(false);
        } else {
          Alert.alert("Restricted", "You must be a Service Provider to list a service. Please update your profile.", [
            { text: "Go to Profile", onPress: () => router.replace('/profile') },
            { text: "Cancel", onPress: () => router.replace('/(tabs)/feed') }
          ]);
        }
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
      Alert.alert("Error", "Could not verify user permissions.");
    }
  };


  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "Maximum 5 images allowed.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const uploadImage = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `services/${user.uid}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    if (!category || !title || !description || !dailyRate || !phone || !area) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const imageUrls = await Promise.all(images.map(uploadImage));
      await addDoc(collection(db, 'services'), {
        title,
        description,
        category,
        dailyRate: parseFloat(dailyRate),
        priceType: 'day',
        phone,
        serviceArea: area,
        workingHours: hours,
        availability: selectedDays,
        images: imageUrls,
        providerId: user.uid,
        providerEmail: user.email,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      Alert.alert("Success", "Service listed successfully!", [
        { text: "OK", onPress: () => router.replace('/feed') }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Failed to list service. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryLabel = CATEGORIES.find(c => c.id === category)?.name || "-- Select Category --";

  if (initializing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Verifying Provider Status...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#94a3b8" />
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List Service</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>🏷️ Service Category</Text>
        
        {/* DROPDOWN BUTTON */}
        <TouchableOpacity 
          style={styles.dropdownBtn} 
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text style={[styles.dropdownText, !category && { color: '#64748b' }]}>
            {category ? `${CATEGORIES.find(c => c.id === category)?.icon}  ${selectedCategoryLabel}` : selectedCategoryLabel}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>📝 Details</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Service Title (e.g. House Cleaning)" 
          placeholderTextColor="#64748b"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Describe your service, experience, tools provided..." 
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.sectionTitle}>💰 Pricing</Text>
        <View style={styles.priceRow}>
          <Text style={styles.currency}>₱</Text>
          <TextInput 
            style={[styles.input, { flex: 1 }]} 
            placeholder="500" 
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={dailyRate}
            onChangeText={setDailyRate}
          />
          <Text style={styles.unit}>/ day</Text>
        </View>

        <Text style={styles.sectionTitle}>📸 Photos</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          <Ionicons name="camera-outline" size={32} color="#94a3b8" />
          <Text style={styles.uploadText}>Add Photo</Text>
        </TouchableOpacity>
        
        <View style={styles.imageGrid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>📅 Availability</Text>
        <View style={styles.daysGrid}>
          {DAYS.map(day => (
            <TouchableOpacity 
              key={day} 
              style={[styles.dayChip, selectedDays.includes(day) && styles.dayChipSelected]}
              onPress={() => toggleDay(day)}
            >
              <Text style={[styles.dayText, selectedDays.includes(day) && styles.dayTextSelected]}>
                {day.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput 
          style={[styles.input, { marginTop: 12 }]} 
          placeholder="Working Hours (e.g. 8 AM - 5 PM)" 
          placeholderTextColor="#64748b"
          value={hours}
          onChangeText={setHours}
        />

        <Text style={styles.sectionTitle}>📞 Contact</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Phone Number" 
          placeholderTextColor="#64748b"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput 
          style={[styles.input, { marginTop: 12 }]} 
          placeholder="Service Area (e.g. Cebu City)" 
          placeholderTextColor="#64748b"
          value={area}
          onChangeText={setArea}
        />

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.btnDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Publish Service</Text>}
        </TouchableOpacity>

      </ScrollView>

      {/* Category Modal */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#f1f5f9" />
              </TouchableOpacity>
            </View>
            <FlatList 
              data={CATEGORIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={() => {
                    setCategory(item.id);
                    setCategoryModalVisible(false);
                  }}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <Text style={{fontSize: 20}}>{item.icon}</Text>
                    <Text style={[
                      styles.modalOptionText, 
                      category === item.id && { color: '#3b82f6', fontWeight: 'bold' }
                    ]}>
                      {item.name}
                    </Text>
                  </View>
                  {category === item.id && <Ionicons name="checkmark" size={20} color="#3b82f6" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#94a3b8', marginLeft: 4 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 20 },

  sectionTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 12 },

  // Dropdown
  dropdownBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1, borderColor: '#334155',
    borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dropdownText: { color: '#f1f5f9', fontSize: 16 },

  // Inputs
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 14, color: '#f1f5f9', fontSize: 16, marginBottom: 12 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currency: { color: '#94a3b8', fontSize: 20 },
  unit: { color: '#94a3b8' },

  uploadBox: { borderWidth: 2, borderColor: '#334155', borderStyle: 'dashed', borderRadius: 12, padding: 24, alignItems: 'center', backgroundColor: '#1e293b' },
  uploadText: { color: '#94a3b8', marginTop: 8 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  imageWrapper: { position: 'relative' },
  previewImage: { width: 80, height: 80, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b' },
  dayChipSelected: { borderColor: '#3b82f6', backgroundColor: '#3b82f6' },
  dayText: { color: '#94a3b8', fontSize: 12 },
  dayTextSelected: { color: '#fff', fontWeight: '700' },

  submitBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  btnDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#f1f5f9' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalOptionText: { color: '#f1f5f9', fontSize: 16 },
});