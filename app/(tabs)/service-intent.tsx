// app/service-intent.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from './.././firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function ServiceIntentPage() {
  const [selectedIntent, setSelectedIntent] = useState<'offer' | 'find' | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        Alert.alert('Not Logged In', 'Please log in to continue.');
        router.replace('/');
      }
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async () => {
    if (!selectedIntent) {
      setMsg({ text: 'Please select an option', isError: true });
      return;
    }

    setLoading(true);
    setMsg(null);

    const user = auth.currentUser;
    if (!user) {
      setMsg({ text: 'Not logged in. Redirecting...', isError: true });
      setTimeout(() => router.replace('/'), 1500);
      setLoading(false);
      return;
    }

    const isProvider = selectedIntent === 'offer';
    const patch = {
      intent: selectedIntent,
      userType: isProvider ? 'provider' : 'client',
      accountType: isProvider ? 'service_provider' : 'service_looker',
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), patch, { merge: true });
      setMsg({ text: '✅ Preference saved! Redirecting...', isError: false });

      setTimeout(() => {
        if (isProvider) {
          router.push('/add-service');
        } else {
          router.push('/feed');
        }
      }, 1200);
    } catch (err: any) {
      setMsg({ text: '❌ Could not save: ' + (err.message || 'Unknown error'), isError: true });
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <Text style={styles.title}>🎯 Service Intent</Text>
          <Text style={styles.subtitle}>Choose how you'd like to get started</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.form}>
            <Text style={styles.legend}>I want to...</Text>

            <TouchableOpacity
              style={[
                styles.radioOption,
                selectedIntent === 'offer' && styles.radioOptionSelected,
              ]}
              onPress={() => setSelectedIntent('offer')}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedIntent === 'offer' }}
            >
              <View style={styles.radioCircle}>
                {selectedIntent === 'offer' && <View style={styles.radioCircleInner} />}
              </View>
              <Text style={[styles.radioLabel, selectedIntent === 'offer' && styles.radioLabelSelected]}>
                🛠️ Offer a service
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioOption,
                selectedIntent === 'find' && styles.radioOptionSelected,
              ]}
              onPress={() => setSelectedIntent('find')}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedIntent === 'find' }}
            >
              <View style={styles.radioCircle}>
                {selectedIntent === 'find' && <View style={styles.radioCircleInner} />}
              </View>
              <Text style={[styles.radioLabel, selectedIntent === 'find' && styles.radioLabelSelected]}>
                🔍 Find a service
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Text style={styles.btnText}>Processing...</Text>
                  <ActivityIndicator color="#fff" size="small" style={{ marginLeft: 8 }} />
                </>
              ) : (
                <Text style={styles.btnText}>Continue</Text>
              )}
            </TouchableOpacity>

            {msg && (
              <View style={[styles.msg, msg.isError ? styles.msgErr : styles.msgOk]}>
                <Text style={styles.msgText}>{msg.text}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea', // Gradient approximation
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  wrap: {
    width: '100%',
    maxWidth: 420,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 60,
    elevation: 20,
  },
  form: {
    gap: 20,
  },
  legend: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  radioOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#334155',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9aa2b1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  radioLabel: {
    fontSize: 16,
    color: '#f5f5f5',
    flex: 1,
  },
  radioLabelSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  msg: {
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  msgOk: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  msgErr: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  msgText: {
    color: '#f5f5f5',
    fontSize: 14,
    textAlign: 'center',
  },
});
