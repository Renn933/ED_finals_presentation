import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getMyAttendance,
  type Attendance,
} from '@/lib/attendance';

type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';
type FilterStatus = 'all' | AttendanceStatus;

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Present', value: 'present' },
  { label: 'Late', value: 'late' },
  { label: 'Excused', value: 'excused' },
  { label: 'Absent', value: 'absent' },
];

const STATUS_COLORS: Record<
  AttendanceStatus,
  { background: string; text: string; dot: string }
> = {
  present: {
    background: '#DCFCE7',
    text: '#166534',
    dot: '#16A34A',
  },
  late: {
    background: '#FEF3C7',
    text: '#92400E',
    dot: '#D97706',
  },
  excused: {
    background: '#DBEAFE',
    text: '#1D4ED8',
    dot: '#2563EB',
  },
  absent: {
    background: '#FEE2E2',
    text: '#991B1B',
    dot: '#DC2626',
  },
};

function getStatus(status: string): AttendanceStatus | 'unknown' {
  const normalized = status.toLowerCase();

  if (
    normalized === 'present' ||
    normalized === 'late' ||
    normalized === 'excused' ||
    normalized === 'absent'
  ) {
    return normalized;
  }

  return 'unknown';
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Time unavailable';
  }

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] =
    useState<FilterStatus>('all');
  const [errorMessage, setErrorMessage] = useState('');

  const loadHistory = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    setErrorMessage('');

    try {
      const { data, error } = await getMyAttendance();

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setRecords(data ?? []);
    } catch (error) {
      console.log('Failed to load attendance history:', error);

      setErrorMessage(
        'Unable to load your attendance records. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = async () => {
    setRefreshing(true);

    try {
      await loadHistory(false);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const countStatus = (status: AttendanceStatus) =>
    records.filter(
      (record) => getStatus(record.status) === status
    ).length;

  const normalizedSearch = search.trim().toLowerCase();

  const filteredRecords = records.filter((record) => {
    const status = getStatus(record.status);

    const matchesStatus =
      activeFilter === 'all' || status === activeFilter;

    const eventTitle = record.event?.title ?? 'School Event';
    const eventCode = record.event?.event_code ?? '';
    const venue = record.event?.venue ?? '';

    const matchesSearch =
      eventTitle.toLowerCase().includes(normalizedSearch) ||
      eventCode.toLowerCase().includes(normalizedSearch) ||
      venue.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.loadingIcon}>
          <ActivityIndicator size="large" color="#38BDF8" />
        </View>

        <Text style={styles.loadingTitle}>Loading History</Text>

        <Text style={styles.loadingSubtitle}>
          Fetching your attendance records...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#0EA5E9"
            colors={['#0EA5E9', '#38BDF8']}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>◷</Text>
            </View>

            <View style={styles.headerBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerBadgeText}>MY RECORDS</Text>
            </View>
          </View>

          <Text style={styles.title}>Attendance</Text>
          <Text style={styles.titleAccent}>History</Text>

          <Text style={styles.subtitle}>
            Keep track of your school events and attendance records.
          </Text>

          {/* TOTAL RECORDS SUMMARY */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Text style={styles.summaryEmoji}>📋</Text>
            </View>

            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>TOTAL RECORDS</Text>
              <Text style={styles.summaryValue}>
                {records.length}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRight}>
              <Text style={styles.summaryLabel}>STATUS</Text>
              <Text style={styles.summaryStatus}>
                {records.length > 0 ? 'Recorded' : 'No records'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* ERROR MESSAGE */}
          {errorMessage !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {errorMessage}
              </Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadHistory()}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ATTENDANCE STATISTICS */}
          <Text style={styles.sectionTitle}>
            Attendance Summary
          </Text>

          <Text style={styles.sectionSubtitle}>
            Overview of your recorded attendance statuses
          </Text>

          <View style={styles.statisticsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Text style={styles.statEmoji}>✅</Text>
              </View>

              <Text style={[styles.statNumber, { color: '#15803D' }]}>
                {countStatus('present')}
              </Text>

              <Text style={styles.statLabel}>Present</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Text style={styles.statEmoji}>⏰</Text>
              </View>

              <Text style={[styles.statNumber, { color: '#B45309' }]}>
                {countStatus('late')}
              </Text>

              <Text style={styles.statLabel}>Late</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Text style={styles.statEmoji}>📝</Text>
              </View>

              <Text style={[styles.statNumber, { color: '#1D4ED8' }]}>
                {countStatus('excused')}
              </Text>

              <Text style={styles.statLabel}>Excused</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Text style={styles.statEmoji}>❌</Text>
              </View>

              <Text style={[styles.statNumber, { color: '#B91C1C' }]}>
                {countStatus('absent')}
              </Text>

              <Text style={styles.statLabel}>Absent</Text>
            </View>
          </View>

          {/* PERSONAL ATTENDANCE HISTORY */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeadingInfo}>
              <Text style={styles.sectionTitle}>
                Recent Activity
              </Text>

              <Text style={styles.sectionSubtitle}>
                Your event attendance history
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {filteredRecords.length}
              </Text>
            </View>
          </View>

          {/* SEARCH */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>⌕</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search event, code, or venue..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              accessibilityLabel="Search attendance history"
            />
          </View>

          {/* STATUS FILTERS */}
          <Text style={styles.filterHeading}>
            FILTER BY STATUS
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {FILTERS.map((filter) => {
              const selected = activeFilter === filter.value;

              return (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterButton,
                    selected && styles.filterButtonActive,
                  ]}
                  onPress={() => setActiveFilter(filter.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selected && styles.filterTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ATTENDANCE RECORDS */}
          {errorMessage !== '' ? null : filteredRecords.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIcon}>
                  {records.length === 0 ? '📋' : '🔎'}
                </Text>
              </View>

              <Text style={styles.emptyTitle}>
                {records.length === 0
                  ? 'No Attendance Yet'
                  : 'No Matching Records'}
              </Text>

              <Text style={styles.emptyText}>
                {records.length === 0
                  ? 'Your attendance records will appear here after you scan an event QR code.'
                  : 'Try another search term or select a different attendance status.'}
              </Text>

              {records.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setSearch('');
                    setActiveFilter('all');
                  }}
                >
                  <Text style={styles.clearButtonText}>
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}

              {records.length === 0 && (
                <View style={styles.emptyHint}>
                  <Text style={styles.emptyHintText}>
                    Your event history will be saved here.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            filteredRecords.map((record) => {
              const status = getStatus(record.status);
              const colors =
                status !== 'unknown'
                  ? STATUS_COLORS[status]
                  : null;

              return (
                <View key={record.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.eventIconCircle}>
                      <Text style={styles.eventIcon}>📅</Text>
                    </View>

                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>
                        {record.event?.title ?? 'School Event'}
                      </Text>

                      <Text style={styles.eventCode}>
                        {record.event?.event_code || 'No event code'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            colors?.background ?? '#F1F5F9',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              colors?.dot ?? '#64748B',
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: colors?.text ?? '#475569',
                          },
                        ]}
                      >
                        {record.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Text>📍</Text>
                    </View>

                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>VENUE</Text>

                      <Text style={styles.detailValue}>
                        {record.event?.venue ?? 'No venue specified'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Text>🗓️</Text>
                    </View>

                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>DATE</Text>

                      <Text style={styles.detailValue}>
                        {formatDate(record.scanned_at)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, styles.lastDetailRow]}>
                    <View style={styles.detailIcon}>
                      <Text>🕒</Text>
                    </View>

                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>
                        TIME RECORDED
                      </Text>

                      <Text style={styles.detailValue}>
                        {formatTime(record.scanned_at)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <Text style={styles.footerText}>
            Attendance History • Stay updated with your events
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F9FF',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  loadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },

  loadingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 22,
    paddingHorizontal: 24,
    paddingBottom: 26,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E0F2FE',
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerIconText: {
    fontSize: 32,
    color: '#0284C7',
    fontWeight: '600',
  },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0EA5E9',
    marginRight: 7,
  },

  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 1,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },

  titleAccent: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0EA5E9',
    letterSpacing: -0.8,
    marginTop: -2,
  },

  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 310,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#D7EEFF',
    borderRadius: 20,
    padding: 17,
    marginTop: 24,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  summaryEmoji: {
    fontSize: 23,
  },

  summaryInfo: {
    flex: 1,
    marginLeft: 13,
  },

  summaryLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '800',
    letterSpacing: 1,
  },

  summaryValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0369A1',
    marginTop: 3,
  },

  summaryDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#BAE6FD',
    marginHorizontal: 14,
  },

  summaryRight: {
    alignItems: 'flex-start',
    minWidth: 78,
  },

  summaryStatus: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 8,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 27,
    paddingBottom: 35,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 18,
  },

  sectionHeadingInfo: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 5,
    marginBottom: 15,
  },

  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },

  statCard: {
    width: '47%',
    flexGrow: 1,
    flexBasis: '40%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  statEmoji: {
    fontSize: 19,
  },

  statNumber: {
    fontSize: 27,
    fontWeight: '900',
  },

  statLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  countBadge: {
    minWidth: 35,
    height: 35,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  countText: {
    color: '#0369A1',
    fontSize: 14,
    fontWeight: '900',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7EEFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
  },

  searchIcon: {
    color: '#0284C7',
    fontSize: 26,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 14,
    fontSize: 13,
    color: '#0F172A',
  },

  filterHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 10,
  },

  filterScroll: {
    marginBottom: 20,
  },

  filterContainer: {
    gap: 8,
    paddingRight: 5,
  },

  filterButton: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7EEFF',
  },

  filterButtonActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },

  filterText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    shadowColor: '#0F172A',
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  eventIconCircle: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventIcon: {
    fontSize: 21,
  },

  eventInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    marginRight: 6,
  },

  eventTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 21,
  },

  eventCode: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#EFF6FF',
    marginVertical: 17,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  lastDetailRow: {
    marginBottom: 0,
  },

  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  detailInfo: {
    flex: 1,
  },

  detailLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  detailValue: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    paddingHorizontal: 25,
    paddingVertical: 35,
    alignItems: 'center',
    marginTop: 3,
  },

  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  emptyIcon: {
    fontSize: 37,
  },

  emptyTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
  },

  emptyHint: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 22,
  },

  emptyHintText: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  clearButton: {
    marginTop: 16,
    backgroundColor: '#0284C7',
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 10,
  },

  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  errorText: {
    color: '#991B1B',
    fontSize: 13,
  },

  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },

  retryText: {
    color: '#991B1B',
    fontWeight: '800',
  },

  footerText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 12,
    marginBottom: 10,
  },
});
