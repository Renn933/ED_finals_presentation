import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profiles';
import { getAllEvents, type Event } from '../../lib/events';

export default function Index() {
  const [studentName, setStudentName] = useState('Student');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  // ============================================
  // LOAD PROFILE AND UPCOMING EVENTS
  // ============================================

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      // Load upcoming events
      try {
        const { data: eventData, error: eventError } =
          await getAllEvents();

        if (eventError) {
          console.log(
            'UPCOMING EVENTS ERROR:',
            eventError.message
          );
          setUpcomingEvents([]);
        } else {
          const now = new Date();

          const upcoming = (eventData ?? [])
            .filter(
              (event) =>
                Boolean(event.start_time) &&
                new Date(event.start_time).getTime() >= now.getTime()
            )
            .sort(
              (a, b) =>
                new Date(a.start_time).getTime() -
                new Date(b.start_time).getTime()
            )
            .slice(0, 3);

          setUpcomingEvents(upcoming);
        }
      } catch (eventError: any) {
        console.log(
          'UPCOMING EVENTS ERROR:',
          eventError?.message
        );
        setUpcomingEvents([]);
      }

      // Get the current logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log('USER ERROR:', userError.message);
        setStudentName('Student');
        return;
      }

      if (!user) {
        setStudentName('Student');
        return;
      }

      // Get the user's profile
      const { data, error } = await getProfile(user.id);

      if (error) {
        console.log('PROFILE ERROR:', error.message);
        setStudentName('Student');
        return;
      }

      setStudentName(
        data?.full_name?.trim() ||
          user.email?.split('@')[0] ||
          'Student'
      );
    } catch (error: any) {
      console.log('DASHBOARD ERROR:', error?.message);
      setStudentName('Student');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // REFRESH DASHBOARD
  // ============================================

  const refresh = async () => {
    setRefreshing(true);

    try {
      await loadProfile();
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================
  // RELOAD WHEN SCREEN GETS FOCUS
  // ============================================

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // ============================================
  // LOADING SCREEN
  // ============================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>QR</Text>
        </View>

        <View style={styles.loadingDots}>
          <ActivityIndicator size="small" color="#2563eb" />
        </View>

        <Text style={styles.loadingTitle}>
          QR Attendance
        </Text>

        <Text style={styles.loadingText}>
          Preparing your dashboard...
        </Text>
      </View>
    );
  }

  // ============================================
  // MAIN DASHBOARD
  // ============================================

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          colors={['#2563eb']}
          tintColor="#2563eb"
        />
      }
    >
      {/* ========================================
          HERO SECTION
      ======================================== */}

      <View style={styles.hero}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />
        <View style={styles.heroCircle} />

        <View style={styles.heroContent}>
          {/* TOP BAR */}

          <View style={styles.topBar}>
            <View>
              <View style={styles.welcomeRow}>
                <View style={styles.onlineDot} />

                <Text style={styles.welcomeText}>
                  STUDENT PORTAL
                </Text>
              </View>

              <Text
                style={styles.studentName}
                numberOfLines={1}
              >
                Hi, {studentName} 👋
              </Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.profileEmoji}>👤</Text>
            </TouchableOpacity>
          </View>

          {/* HERO MESSAGE */}

          <View style={styles.heroMessage}>
            <Text style={styles.heroSmallTitle}>
              YOUR ATTENDANCE
            </Text>

            <Text style={styles.heroTitle}>
              Stay present.
              {'\n'}
              Stay connected.
            </Text>

            <Text style={styles.heroSubtitle}>
              Quickly check in to your school
              events using a QR code.
            </Text>
          </View>

          {/* FLOATING QR VISUAL */}

          <View style={styles.floatingQR}>
            <View style={styles.qrOuter}>
              <View style={styles.qrInner}>
                <Text style={styles.qrText}>QR</Text>
              </View>
            </View>

            <View style={styles.qrScanLine} />
          </View>
        </View>
      </View>

      {/* ========================================
          MAIN CONTENT
      ======================================== */}

      <View style={styles.content}>
        {/* QUICK STATUS */}

        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View style={styles.statusIcon}>
              <Text style={styles.statusCheck}>✓</Text>
            </View>

            <View>
              <Text style={styles.statusLabel}>
                ATTENDANCE STATUS
              </Text>

              <Text style={styles.statusTitle}>
                Ready for check-in
              </Text>
            </View>
          </View>

          <View style={styles.readyBadge}>
            <View style={styles.readyDot} />

            <Text style={styles.readyText}>
              READY
            </Text>
          </View>
        </View>

        {/* ======================================
            PRIMARY SCAN ACTION
        ====================================== */}

        <TouchableOpacity
          style={styles.scanCard}
          onPress={() => router.push('/scan')}
          activeOpacity={0.9}
        >
          <View style={styles.scanDecorationOne} />
          <View style={styles.scanDecorationTwo} />

          <View style={styles.scanCardContent}>
            <View style={styles.scanTop}>
              <View style={styles.scanIconBox}>
                <Text style={styles.scanIcon}>◫</Text>
              </View>

              <View style={styles.scanBadge}>
                <Text style={styles.scanBadgeText}>
                  QUICK CHECK-IN
                </Text>
              </View>
            </View>

            <Text style={styles.scanTitle}>
              Scan Event QR
            </Text>

            <Text style={styles.scanDescription}>
              Scan your teacher's QR code to
              record your attendance instantly.
            </Text>

            <View style={styles.scanButton}>
              <Text style={styles.scanButtonText}>
                Start Scanning
              </Text>

              <Text style={styles.scanButtonArrow}>
                →
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ======================================
            UPCOMING EVENT REMINDERS
        ====================================== */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Upcoming Events
            </Text>

            <Text style={styles.sectionSubtitle}>
              Don't miss your next school activity
            </Text>
          </View>

          <View style={styles.sectionAccent} />
        </View>

        {upcomingEvents.length === 0 ? (
          <View style={styles.reminderEmpty}>
            <Text style={styles.reminderEmptyTitle}>
              No upcoming events
            </Text>

            <Text style={styles.reminderEmptyText}>
              New school activities will appear here.
            </Text>
          </View>
        ) : (
          upcomingEvents.map((event) => (
            <View
              key={event.id}
              style={styles.reminderCard}
            >
              <View style={styles.reminderIcon}>
                <Text style={styles.reminderIconText}>
                  📅
                </Text>
              </View>

              <View style={styles.reminderDetails}>
                <Text style={styles.reminderTitle}>
                  {event.title}
                </Text>

                <Text style={styles.reminderDate}>
                  {new Date(
                    event.start_time
                  ).toLocaleString()}
                </Text>

                {event.venue ? (
                  <Text style={styles.reminderVenue}>
                    {event.venue}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}

        {/* ======================================
            QUICK ACTIONS
        ====================================== */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Quick Access
            </Text>

            <Text style={styles.sectionSubtitle}>
              Manage your attendance account
            </Text>
          </View>

          <View style={styles.sectionAccent} />
        </View>

        <View style={styles.actionGrid}>
          {/* HISTORY */}

          <TouchableOpacity
            style={[
              styles.actionCard,
              styles.historyCard,
            ]}
            onPress={() => router.push('/history')}
            activeOpacity={0.85}
          >
            <View style={styles.actionIconBlue}>
              <Text style={styles.actionEmoji}>◷</Text>
            </View>

            <Text style={styles.actionTitle}>
              History
            </Text>

            <Text style={styles.actionDescription}>
              View your attendance records
            </Text>

            <View style={styles.actionArrow}>
              <Text style={styles.actionArrowText}>
                →
              </Text>
            </View>
          </TouchableOpacity>

          {/* PROFILE */}

          <TouchableOpacity
            style={[
              styles.actionCard,
              styles.profileCard,
            ]}
            onPress={() => router.push('/profile')}
            activeOpacity={0.85}
          >
            <View style={styles.actionIconPurple}>
              <Text style={styles.actionEmoji}>◎</Text>
            </View>

            <Text style={styles.actionTitle}>
              My Profile
            </Text>

            <Text style={styles.actionDescription}>
              Manage your account details
            </Text>

            <View style={styles.actionArrow}>
              <Text style={styles.actionArrowText}>
                →
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ======================================
            HOW IT WORKS
        ====================================== */}

        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <View style={styles.guideIcon}>
              <Text style={styles.guideIconText}>?</Text>
            </View>

            <View style={styles.guideHeaderText}>
              <Text style={styles.guideTitle}>
                How check-in works
              </Text>

              <Text style={styles.guideSubtitle}>
                Complete your attendance in 3 steps
              </Text>
            </View>
          </View>

          {/* STEP 1 */}

          <View style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={styles.timelineNumber}>
                <Text style={styles.timelineNumberText}>
                  1
                </Text>
              </View>

              <View style={styles.timelineLine} />
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>
                Attend your event
              </Text>

              <Text style={styles.timelineText}>
                Go to your scheduled school
                activity or event.
              </Text>
            </View>
          </View>

          {/* STEP 2 */}

          <View style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={styles.timelineNumber}>
                <Text style={styles.timelineNumberText}>
                  2
                </Text>
              </View>

              <View style={styles.timelineLine} />
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>
                Scan the QR code
              </Text>

              <Text style={styles.timelineText}>
                Open the scanner and point your
                camera at the teacher's QR code.
              </Text>
            </View>
          </View>

          {/* STEP 3 */}

          <View style={styles.timelineItemLast}>
            <View style={styles.timelineLeft}>
              <View style={styles.timelineNumber}>
                <Text style={styles.timelineNumberText}>
                  3
                </Text>
              </View>
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>
                You're checked in
              </Text>

              <Text style={styles.timelineText}>
                Your attendance is recorded
                automatically.
              </Text>
            </View>
          </View>
        </View>

        {/* ======================================
            SECURITY MESSAGE
        ====================================== */}

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Text style={styles.securityIconText}>
              ✓
            </Text>
          </View>

          <View style={styles.securityTextContainer}>
            <Text style={styles.securityTitle}>
              Attendance protected
            </Text>

            <Text style={styles.securityText}>
              Your check-in is securely recorded
              in the attendance system.
            </Text>
          </View>

          <Text style={styles.securityArrow}>→</Text>
        </View>

        {/* ======================================
            FOOTER
        ====================================== */}

        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Text style={styles.footerLogoText}>
              QR
            </Text>
          </View>

          <Text style={styles.footerTitle}>
            QR Attendance
          </Text>

          <Text style={styles.footerSubtitle}>
            School Event Attendance System
          </Text>

          <View style={styles.footerLine} />

          <Text style={styles.footerCopyright}>
            Simple • Fast • Secure
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },

  // LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f8fc',
  },
  loadingLogo: {
    width: 72,
    height: 72,
    borderRadius: 23,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  loadingLogoText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  loadingDots: {
    marginBottom: 10,
  },
  loadingTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  loadingText: {
    marginTop: 5,
    color: '#94a3b8',
    fontSize: 12,
  },

  // HERO
  hero: {
    height: 350,
    backgroundColor: '#1d4ed8',
    overflow: 'hidden',
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
  },
  heroContent: {
    flex: 1,
    paddingTop: 57,
    paddingHorizontal: 22,
  },
  heroGlowOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.055)',
    right: -90,
    top: -95,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(96,165,250,0.13)',
    left: -100,
    bottom: -80,
  },
  heroCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    right: 45,
    bottom: 25,
  },

  // TOP BAR
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#86efac',
    marginRight: 7,
  },
  welcomeText: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  studentName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    maxWidth: 275,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
  profileEmoji: {
    fontSize: 22,
  },

  // HERO MESSAGE
  heroMessage: {
    marginTop: 28,
    maxWidth: 285,
  },
  heroSmallTitle: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: '#dbeafe',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 9,
    maxWidth: 270,
  },

  // FLOATING QR
  floatingQR: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 92,
    height: 92,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '7deg' }],
  },
  qrOuter: {
    width: 59,
    height: 59,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrInner: {
    width: 45,
    height: 45,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '900',
  },
  qrScanLine: {
    position: 'absolute',
    width: 54,
    height: 2,
    backgroundColor: '#60a5fa',
    top: 45,
  },

  // MAIN CONTENT
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // STATUS CARD
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#0f172a',
    shadowOpacity: 0.055,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusCheck: {
    color: '#16a34a',
    fontSize: 24,
    fontWeight: '900',
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },
  readyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  readyText: {
    color: '#15803d',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // QR SCAN CARD
  scanCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 25,
    padding: 20,
    marginBottom: 30,
    overflow: 'hidden',
  },
  scanDecorationOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    right: -65,
    top: -70,
  },
  scanDecorationTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    right: 20,
    bottom: -55,
  },
  scanCardContent: {
    position: 'relative',
  },
  scanTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  scanIconBox: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.17)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanIcon: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
  },
  scanBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  scanBadgeText: {
    color: '#dbeafe',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  scanTitle: {
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '900',
    marginBottom: 8,
  },
  scanDescription: {
    color: '#dbeafe',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 280,
  },
  scanButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 11,
    marginTop: 20,
  },
  scanButtonText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '900',
  },
  scanButtonArrow: {
    color: '#1d4ed8',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 12,
  },

  // SECTION HEADERS
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
  sectionAccent: {
    width: 35,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#60a5fa',
  },

  // UPCOMING EVENT REMINDERS
  reminderEmpty: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5eaf3',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 30,
  },
  reminderEmptyTitle: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
  },
  reminderEmptyText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  reminderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reminderIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderIconText: {
    fontSize: 22,
  },
  reminderDetails: {
    flex: 1,
  },
  reminderTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  reminderDate: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  reminderVenue: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },

  // QUICK ACTIONS
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  actionCard: {
    flex: 1,
    minHeight: 180,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e5eaf3',
  },
  historyCard: {
    borderTopWidth: 3,
    borderTopColor: '#3b82f6',
  },
  profileCard: {
    borderTopWidth: 3,
    borderTopColor: '#8b5cf6',
  },
  actionIconBlue: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
  },
  actionIconPurple: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
  },
  actionEmoji: {
    color: '#1d4ed8',
    fontSize: 25,
    fontWeight: '900',
  },
  actionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  actionDescription: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  actionArrow: {
    alignSelf: 'flex-end',
    marginTop: 'auto',
    paddingTop: 10,
  },
  actionArrowText: {
    color: '#2563eb',
    fontSize: 22,
    fontWeight: '800',
  },

  // HOW IT WORKS
  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    marginBottom: 20,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  guideIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guideIconText: {
    color: '#2563eb',
    fontSize: 22,
    fontWeight: '900',
  },
  guideHeaderText: {
    flex: 1,
  },
  guideTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  guideSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 82,
  },
  timelineItemLast: {
    flexDirection: 'row',
    minHeight: 55,
  },
  timelineLeft: {
    width: 42,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineNumber: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineNumberText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '900',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#dbeafe',
    marginVertical: 5,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineTitle: {
    color: '#1e293b',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  timelineText: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  // SECURITY MESSAGE
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 15,
    marginBottom: 25,
  },
  securityIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityIconText: {
    color: '#059669',
    fontSize: 23,
    fontWeight: '900',
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    color: '#065f46',
    fontSize: 13,
    fontWeight: '900',
  },
  securityText: {
    color: '#047857',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  securityArrow: {
    color: '#059669',
    fontSize: 21,
    fontWeight: '900',
    marginLeft: 8,
  },

  // FOOTER
  footer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 15,
  },
  footerLogo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  footerLogoText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  footerTitle: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '900',
  },
  footerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
  footerLine: {
    width: 60,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#dbeafe',
    marginVertical: 15,
  },
  footerCopyright: {
    color: '#94a3b8',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
