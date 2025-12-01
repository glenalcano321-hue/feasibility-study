import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from './../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';


const MOCK_BOOKING = {
  id: "mock_demo_123",
  serviceId: "mock_svc_demo",
  serviceTitle: "✨ Demo House Cleaning",
  date: "2025-11-30",
  time: "10:00 AM",
  rooms: 3,
  details: "Please use non-toxic cleaner for the nursery.",
  status: "in_progress", 
  role: "customer", 
  providerId: "mock_provider_1",
  createdAt: { seconds: Date.now() / 1000 } 
};

export default function MyBookingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        subscribeToBookings(user.uid);
      } else {
        setLoading(false);
        // If not logged in, send to index
        router.replace('/');
      }
    });
    return unsubscribeAuth;
  }, []);

  const subscribeToBookings = (uid: string) => {
    let customerBookings: any[] = [];
    let providerBookings: any[] = [];

    const updateState = () => {
      // 1. Merge Real Bookings
      const allReal = [...customerBookings, ...providerBookings];
      
      // 2. Remove duplicates
      const uniqueReal = Array.from(new Map(allReal.map(item => [item.id, item])).values());
      
      // 3. Add Mock Booking
      const combined = [MOCK_BOOKING, ...uniqueReal];

      // 4. Sort by date (newest first)
      combined.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      setBookings(combined);
      setLoading(false);
    };

    // Query 1: As Customer
    const q1 = query(collection(db, 'bookings'), where('customerId', '==', uid));
    const unsub1 = onSnapshot(q1, (snap) => {
      customerBookings = snap.docs.map(d => ({ id: d.id, ...d.data(), role: 'customer' }));
      updateState();
    });

    // Query 2: As Provider
    const q2 = query(collection(db, 'bookings'), where('providerId', '==', uid));
    const unsub2 = onSnapshot(q2, (snap) => {
      providerBookings = snap.docs.map(d => ({ id: d.id, ...d.data(), role: 'provider' }));
      updateState();
    });

    return () => {
      unsub1();
      unsub2();
    };
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    // Handle Mock
    if (bookingId.startsWith('mock_')) {
      Alert.alert("Demo Mode", `Status updated to: ${status.replace('_', ' ')} (Simulated)`);
      return;
    }

    // Handle Real
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        {/* FIX: Explicitly navigate to the Profile Tab */}
        <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#334155" />
            <Text style={styles.emptyText}>No bookings found.</Text>
          </View>
        ) : (
          bookings.map((booking, index) => (
            <BookingCard 
              key={booking.id || index} 
              booking={booking} 
              onUpdateStatus={handleUpdateStatus} 
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- SUB COMPONENTS ---

function BookingCard({ booking, onUpdateStatus }: { booking: any, onUpdateStatus: (id: string, status: string) => void }) {
  const isProvider = booking.role === 'provider';
  const { percent, label, color } = getProgressInfo(booking.status);

  // Fallback for service title
  const displayTitle = booking.serviceTitle || (booking.serviceId === 'mock_svc_demo' ? '✨ Demo House Cleaning' : 'Service Request');

  return (
    <View style={styles.card}>
      
      {/* Header Row */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceTitle}>{displayTitle}</Text>
          <Text style={styles.dateText}>
            📅 {booking.date} • {booking.time}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
          <Text style={[styles.badgeText, { color: color }]}>
            {booking.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.detailsText}>
        {booking.rooms} Rooms • {booking.details || 'No additional notes'}
      </Text>
      
      <Text style={styles.idText}>ID: {booking.id}</Text>

      {/* SERVICE TRACKER */}
      <View style={styles.trackerContainer}>
        <View style={styles.trackerHeader}>
          <Text style={styles.trackerLabel}>{label}</Text>
          <Text style={styles.trackerPercent}>{percent}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
        </View>
        <View style={styles.trackerSteps}>
          <Text style={styles.stepText}>Pending</Text>
          <Text style={styles.stepText}>Accepted</Text>
          <Text style={styles.stepText}>Working</Text>
          <Text style={styles.stepText}>Done</Text>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actions}>
        
        {/* PENDING ACTIONS */}
        {booking.status === 'pending' && isProvider && (
          <>
            <TouchableOpacity style={[styles.btn, styles.btnSuccess]} onPress={() => onUpdateStatus(booking.id, 'accepted')}>
              <Text style={styles.btnText}>✓ Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={() => onUpdateStatus(booking.id, 'rejected')}>
              <Text style={styles.btnText}>✕ Decline</Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === 'pending' && !isProvider && (
          <TouchableOpacity style={[styles.btn, styles.btnDangerOutline]} onPress={() => onUpdateStatus(booking.id, 'rejected')}>
            <Text style={styles.btnTextDanger}>Cancel Request</Text>
          </TouchableOpacity>
        )}

        {/* ACCEPTED ACTIONS */}
        {booking.status === 'accepted' && isProvider && (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => onUpdateStatus(booking.id, 'in_progress')}>
            <Text style={styles.btnText}>▶ Start Job</Text>
          </TouchableOpacity>
        )}
        {booking.status === 'accepted' && !isProvider && (
          <Text style={styles.waitingText}>Waiting for provider to start...</Text>
        )}

        {/* IN PROGRESS ACTIONS */}
        {booking.status === 'in_progress' && isProvider && (
          <TouchableOpacity style={[styles.btn, styles.btnSuccess]} onPress={() => onUpdateStatus(booking.id, 'completed')}>
            <Text style={styles.btnText}>✓ Mark Finished</Text>
          </TouchableOpacity>
        )}
        {booking.status === 'in_progress' && !isProvider && (
          <Text style={[styles.waitingText, { color: '#3b82f6' }]}>Provider is working now...</Text>
        )}

        {/* COMPLETED ACTIONS */}
        {booking.status === 'completed' && !isProvider && (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => Alert.alert("Review", "Review system coming soon!")}>
            <Text style={styles.btnText}>★ Leave Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// --- HELPERS ---

function getProgressInfo(status: string) {
  switch (status) {
    case 'pending': return { percent: 5, label: 'Request Sent', color: '#f59e0b' }; // Orange
    case 'accepted': return { percent: 25, label: 'Scheduled', color: '#3b82f6' }; // Blue
    case 'in_progress': return { percent: 75, label: 'In Progress', color: '#10b981' }; // Green
    case 'completed': return { percent: 100, label: 'Completed', color: '#10b981' }; // Green
    case 'rejected': return { percent: 0, label: 'Cancelled', color: '#ef4444' }; // Red
    default: return { percent: 0, label: 'Unknown', color: '#94a3b8' }; // Gray
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16 },
  
  // Empty State
  emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
  emptyText: { color: '#94a3b8', marginTop: 16, fontSize: 16 },

  // Card
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  serviceTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  dateText: { color: '#94a3b8', fontSize: 14 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  detailsText: { color: '#cbd5e1', fontSize: 14, marginBottom: 8 },
  idText: { color: '#64748b', fontSize: 12, marginBottom: 16 },

  // Tracker
  trackerContainer: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  trackerLabel: { color: '#f1f5f9', fontSize: 12, fontWeight: '600' },
  trackerPercent: { color: '#f1f5f9', fontSize: 12, fontWeight: '700' },
  progressBarBg: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 4 },
  trackerSteps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  stepText: { color: '#64748b', fontSize: 10 },

  // Actions
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', alignItems: 'center' },
  waitingText: { color: '#94a3b8', fontSize: 14, fontStyle: 'italic' },
  
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnSuccess: { backgroundColor: '#10b981' },
  btnDanger: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderColor: '#ef4444' },
  btnDangerOutline: { borderWidth: 1, borderColor: '#ef4444' },
  
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnTextDanger: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
});