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
  SafeAreaView, 
  Modal,
  FlatList,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from './../firebase'; 
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// --- Role Options ---
const ROLE_OPTIONS = [
  { label: '--- Find Services ---', value: 'header-1', header: true },
  { label: '🧹 Find House Cleaning', value: 'cleaning' },
  { label: '👶 Find Child Care', value: 'childcare' },
  { label: '👴 Find Elder Care', value: 'eldercare' },
  { label: '👩‍🍳 Find a Chef', value: 'cooking' },
  { label: '🔧 Find Maintenance', value: 'maintenance' },
  { label: '🌱 Find Gardening', value: 'gardening' },
  { label: '--- Offer Services (Provider) ---', value: 'header-2', header: true },
  { label: '🧹 Offer Cleaning Services', value: 'provider-cleaning' },
  { label: '👶 Offer Child Care', value: 'provider-childcare' },
  { label: '👴 Offer Elder Care', value: 'provider-eldercare' },
  { label: '👩‍🍳 Offer Cooking', value: 'provider-cooking' },
  { label: '🔧 Offer Maintenance', value: 'provider-maintenance' },
  { label: '🌱 Offer Gardening', value: 'provider-gardening' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  
  // This 'role' state tracks the dropdown value (e.g. 'provider-cleaning')
  const [role, setRole] = useState('cleaning');
  
  // This 'accountType' state tracks the Firebase field (e.g. 'service_provider')
  const [accountType, setAccountType] = useState('service_looker');
  
  // UI State
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email || '');
        setName(currentUser.displayName || '');
        await fetchProfileData(currentUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const fetchProfileData = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || auth.currentUser?.displayName || '');
        setBio(data.bio || '');
        
        // Load saved role (dropdown value)
        let r = data.role || 'cleaning';
        if (r === 'family') r = 'cleaning';
        if (r === 'worker') r = 'provider-cleaning';
        setRole(r);

        // Load account type
        setAccountType(data.accountType || 'service_looker');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    setSaving(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
        
        const isProvider = role.startsWith('provider-');
        const newAccountType = isProvider ? 'service_provider' : 'service_looker';
        
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          name,
          role, // Save dropdown value
          accountType: newAccountType, // Save correct Firebase Rule type
          serviceType: isProvider ? role.replace('provider-', '') : role, // Save specific category
          userType: isProvider ? 'provider' : 'client', // Legacy support
          bio,
          updatedAt: serverTimestamp()
        }, { merge: true });

        setAccountType(newAccountType); // Update local state immediately
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error(error);
    }
  };

  const getInitials = (n: string) => n ? n.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : 'U';
  
  // Check accountType for button visibility
  const isProviderAccount = accountType === 'service_provider';
  const selectedRoleLabel = ROLE_OPTIONS.find(r => r.value === role)?.label || role;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>?</Text></View>
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.subtitle}>Please sign in to manage your profile.</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/')}>
          <Text style={styles.btnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#0f172a'}}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.navHeader}>
          <Text style={styles.brand}>Profile</Text> 
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </View>

        <View style={styles.card}>
          
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            </View>
            <Text style={styles.displayName}>{name || 'User Name'}</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={styles.formGrid}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input} 
                value={name}
                onChangeText={setName}
                placeholder="e.g. Juan dela Cruz"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput 
                style={[styles.input, styles.disabledInput]} 
                value={email}
                editable={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>I am here to</Text>
              <TouchableOpacity 
                style={styles.selectButton} 
                onPress={() => setRoleModalVisible(true)}
              >
                <Text style={styles.selectButtonText}>{selectedRoleLabel}</Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bio / Requirements</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                maxLength={600}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#64748b"
              />
              <Text style={styles.charCounter}>{bio.length} / 600</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.actionsContainer}>
            <View style={styles.mainActions}>
              <TouchableOpacity 
                style={styles.btnPrimary} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Profile</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.btnSecondary} 
                onPress={() => router.push('/my-bookings')}
              >
                <Text style={styles.btnTextSecondary}>📅 My Bookings</Text>
              </TouchableOpacity>

              {/* CHECK ACCOUNT TYPE HERE */}
              {isProviderAccount && (
                <TouchableOpacity 
                  style={styles.btnSecondary} 
                  onPress={() => router.push('/add-service')}
                >
                  <Text style={styles.btnTextSecondary}>➕ List Service</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.btnDanger} onPress={handleSignOut}>
              <Text style={styles.btnTextDanger}>Sign Out</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <Modal visible={roleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Role</Text>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                <Ionicons name="close" size={24} color="#f1f5f9" />
              </TouchableOpacity>
            </View>
            <FlatList 
              data={ROLE_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                if (item.header) {
                  return <Text style={styles.modalSectionHeader}>{item.label}</Text>;
                }
                return (
                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setRole(item.value);
                      setRoleModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText, 
                      role === item.value && { color: '#3b82f6', fontWeight: 'bold' }
                    ]}>
                      {item.label}
                    </Text>
                    {role === item.value && <Ionicons name="checkmark" size={20} color="#3b82f6" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 20 },
  
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  brand: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },

  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },

  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: '#1e293b',
  },
  avatarText: { fontSize: 40, fontWeight: '700', color: '#fff' },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#10b981', width: 28, height: 28,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#1e293b',
  },
  displayName: { fontSize: 24, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  emailText: { fontSize: 14, color: '#94a3b8' },

  formGrid: { gap: 20 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1, borderColor: '#334155',
    borderRadius: 12, padding: 14,
    color: '#f1f5f9', fontSize: 16,
  },
  disabledInput: { opacity: 0.6 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  charCounter: { fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 4 },
  
  selectButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1, borderColor: '#334155',
    borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectButtonText: { color: '#f1f5f9', fontSize: 16 },

  divider: { height: 1, backgroundColor: '#334155', marginVertical: 32 },

  actionsContainer: { gap: 16 },
  mainActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  
  btnPrimary: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: '#334155',
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  btnTextSecondary: { color: '#f1f5f9', fontWeight: '600', fontSize: 16 },

  btnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 16
  },
  btnTextDanger: { color: '#ef4444', fontWeight: '600', fontSize: 16 },

  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 8 },
  subtitle: { color: '#94a3b8', marginBottom: 24 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#f1f5f9' },
  modalSectionHeader: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalOptionText: { color: '#f1f5f9', fontSize: 16 },
});