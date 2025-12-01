import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Modal, 
  FlatList,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from './.././firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

const MOCK_PROVIDERS: any = {
  "1": { name: "Maria Santos", avatar: "MS", rate: 200 },
  "2": { name: "Ana Rodriguez", avatar: "AR", rate: 250 },
  "3": { name: "Carmen dela Cruz", avatar: "CC", rate: 300 },
  "4": { name: "Jessica Reyes", avatar: "JR", rate: 250 },
  "5": { name: "Patricia Lim", avatar: "PL", rate: 300 },
  "6": { name: "Grace Martinez", avatar: "GM", rate: 280 },
  "7": { name: "Chef Marco Silva", avatar: "MS", rate: 500 },
  "8": { name: "Roberto Santos", avatar: "RS", rate: 450 },
  "9": { name: "Jose Mendoza", avatar: "JM", rate: 400 },
  "10": { name: "Antonio Verde", avatar: "AV", rate: 320 }
};

const MOCK_SERVICES = [
  { id: "mock1", title: "Standard Service (Demo)", dailyRate: 500, description: "This is a demo service description." },
  { id: "mock2", title: "Premium Service (Demo)", dailyRate: 1200, description: "Deep cleaning and premium add-ons." }
];

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const providerId = params.providerId as string;

  // Data State
  const [provider, setProvider] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [rateDisplay, setRateDisplay] = useState('--');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [date, setDate] = useState(''); // Using simple text for simplicity (use DateTimePicker in prod)
  const [time, setTime] = useState('');
  const [rooms, setRooms] = useState(3);
  const [details, setDetails] = useState('');
  
  // UI State
  const [serviceModalVisible, setServiceModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [providerId]);

  const loadData = async () => {
    if (!providerId) return;

    try {
      // 1. Fetch Provider
      let providerData = null;
      // Try 'serviceProviders' collection
      const providerDoc = await getDoc(doc(db, "serviceProviders", providerId));
      if (providerDoc.exists()) {
        providerData = providerDoc.data();
      } else {
        // Try 'users' collection
        const userDoc = await getDoc(doc(db, "users", providerId));
        if (userDoc.exists()) providerData = userDoc.data();
      }

      // Fallback to Mock
      if (!providerData && MOCK_PROVIDERS[providerId]) {
        providerData = MOCK_PROVIDERS[providerId];
      }

      setProvider(providerData || { name: "Unknown Provider" });

      // 2. Fetch Services
      const servicesRef = collection(db, "services");
      const q = query(servicesRef, where("providerId", "==", providerId), where("status", "==", "active"));
      const querySnapshot = await getDocs(q);

      let fetchedServices: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedServices.push({ id: doc.id, ...doc.data() });
      });

      // Fallback Mock Services
      if (fetchedServices.length === 0) {
        fetchedServices = MOCK_SERVICES;
      }

      setServices(fetchedServices);

      // 3. Calculate Rate Range
      let min = Infinity;
      let max = 0;
      fetchedServices.forEach(s => {
        const price = s.dailyRate || s.hourlyRate || 0;
        if (price > 0) {
          if (price < min) min = price;
          if (price > max) max = price;
        }
      });

      if (min !== Infinity) {
        setRateDisplay(min === max ? `₱${min}` : `₱${min} - ₱${max}`);
      } else {
        setRateDisplay('Ask for rate');
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not load booking data.");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !date || !time) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "You must be logged in to book.");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'bookings'), {
        customerId: user.uid,
        providerId: providerId,
        serviceId: selectedService.id,
        serviceTitle: selectedService.title, // Store snapshot of title
        date,
        time,
        rooms,
        details,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      Alert.alert("Success", "Booking request sent!", [
        { text: "OK", onPress: () => router.replace('/feed') }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Provider Card */}
        <View style={styles.providerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(provider?.name)}</Text>
          </View>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{provider?.name}</Text>
            <View style={styles.providerMeta}>
              <View style={styles.rateBadge}>
                <Text style={styles.rateText}>{rateDisplay}</Text>
              </View>
              <Text style={styles.idText}>ID: {providerId?.slice(0,6)}...</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          
          {/* Service Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Select Service</Text>
            <TouchableOpacity 
              style={styles.selectButton} 
              onPress={() => setServiceModalVisible(true)}
            >
              <Text style={[styles.selectText, !selectedService && { color: '#64748b' }]}>
                {selectedService ? selectedService.title : '-- Choose a service --'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Service Details Box */}
          {selectedService && (
            <View style={styles.serviceDetails}>
              <View style={styles.rowBetween}>
                <Text style={styles.detailLabel}>Estimated Rate:</Text>
                <Text style={styles.priceHighlight}>
                  ₱{selectedService.dailyRate || selectedService.hourlyRate || 0}
                  <Text style={styles.unitText}>
                    {selectedService.dailyRate ? '/day' : '/hr'}
                  </Text>
                </Text>
              </View>
              <Text style={styles.description}>{selectedService.description}</Text>
            </View>
          )}

          {/* Date & Time Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Date</Text>
              <TextInput 
                style={styles.input} 
                placeholder="YYYY-MM-DD" 
                placeholderTextColor="#64748b"
                value={date}
                onChangeText={setDate}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Time</Text>
              <TextInput 
                style={styles.input} 
                placeholder="00:00 AM" 
                placeholderTextColor="#64748b"
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>

          {/* Room Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Number of Rooms</Text>
            <View style={styles.roomSelector}>
              {[1, 2, 3, 4].map((num) => (
                <TouchableOpacity 
                  key={num} 
                  style={[styles.roomBtn, rooms === num && styles.roomBtnSelected]}
                  onPress={() => setRooms(num)}
                >
                  <Text style={[styles.roomBtnText, rooms === num && styles.roomBtnTextSelected]}>
                    {num}{num === 4 ? '+' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Details */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              multiline 
              numberOfLines={3}
              placeholder="Any specific instructions?"
              placeholderTextColor="#64748b"
              value={details}
              onChangeText={setDetails}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity 
            style={[styles.confirmBtn, submitting && styles.btnDisabled]} 
            onPress={handleBooking}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm Booking</Text>}
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Service Selection Modal */}
      <Modal visible={serviceModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Service</Text>
            <FlatList
              data={services}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedService(item);
                    setServiceModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.title}</Text>
                  <Text style={styles.modalItemPrice}>
                    ₱{item.dailyRate || item.hourlyRate}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setServiceModalVisible(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  scrollContent: { padding: 20 },
  
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
  backBtn: { padding: 8, marginLeft: -8 },
  pageTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#f1f5f9' },

  // Provider Card
  providerCard: {
    backgroundColor: '#1e293b', // fallback for gradient
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 18, fontWeight: '600', color: '#f1f5f9', marginBottom: 4 },
  providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rateBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  rateText: { color: '#10b981', fontWeight: '600', fontSize: 12 },
  idText: { color: '#94a3b8', fontSize: 12 },

  // Form
  form: { gap: 16 },
  formGroup: { marginBottom: 8 },
  formRow: { flexDirection: 'row', gap: 16 },
  label: { color: '#94a3b8', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1, borderColor: '#334155',
    borderRadius: 12, padding: 14,
    color: '#f1f5f9', fontSize: 16,
  },
  selectButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1, borderColor: '#334155',
    borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectText: { color: '#f1f5f9', fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  // Room Selector
  roomSelector: { flexDirection: 'row', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 4 },
  roomBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  roomBtnSelected: { backgroundColor: '#3b82f6' },
  roomBtnText: { color: '#94a3b8', fontWeight: '500' },
  roomBtnTextSelected: { color: '#fff', fontWeight: '700' },

  // Service Details Box
  serviceDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed',
    borderRadius: 8, padding: 12, marginBottom: 12,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  detailLabel: { color: '#94a3b8', fontSize: 14 },
  priceHighlight: { color: '#10b981', fontWeight: '700', fontSize: 16 },
  unitText: { fontSize: 12, fontWeight: '400', color: '#94a3b8' },
  description: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },

  // Buttons
  confirmBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 12,
    shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  btnDisabled: { opacity: 0.7 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16, textAlign: 'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalItemText: { color: '#f1f5f9', fontSize: 16 },
  modalItemPrice: { color: '#10b981', fontWeight: '600' },
  modalClose: { marginTop: 16, padding: 12, alignItems: 'center' },
  modalCloseText: { color: '#94a3b8', fontSize: 16 },
});