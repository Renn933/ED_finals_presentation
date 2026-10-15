import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { supabase } from '../../lib/supabase';

type Role =
  | 'student'
  | 'teacher'
  | 'admin';

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
};

type Event = {
  id: string;
  event_code: string | null;
  title: string;
  venue: string | null;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  created_by: string | null;
};

type Attendance = {
  id: string;
  student_id: string;
  event_id: string;
  status: string | null;
  scanned_at: string | null;
};

type AttendanceDisplay =
  Attendance & {
    studentName: string;
    studentEmail: string;
    eventTitle: string;
  };

export default function AdminScreen() {
  const router = useRouter();

  const [users, setUsers] =
    useState<Profile[]>([]);

  const [events, setEvents] =
    useState<Event[]>([]);

  const [attendance, setAttendance] =
    useState<AttendanceDisplay[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // EDIT EVENT
  const [editingEvent, setEditingEvent] =
    useState<Event | null>(null);

  const [editTitle, setEditTitle] =
    useState('');

  const [editVenue, setEditVenue] =
    useState('');

  const [editDescription, setEditDescription] =
    useState('');

  const [savingEvent, setSavingEvent] =
    useState(false);

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  const loadDashboard =
    useCallback(async () => {
      try {
        setError(null);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          router.replace('/login');
          return;
        }

        // ==========================================
        // CHECK CURRENT USER
        // ==========================================

        const {
          data: currentProfile,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select(
            'id,email,full_name,role'
          )
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!currentProfile) {
          throw new Error(
            'Your profile was not found.'
          );
        }

        if (
          currentProfile.role !==
          'admin'
        ) {
          Alert.alert(
            'Access Denied',
            'Only administrators can access this page.',
            [
              {
                text: 'OK',
                onPress: () =>
                  router.replace('/'),
              },
            ]
          );

          return;
        }

        // ==========================================
        // LOAD USERS
        // ==========================================

        const {
          data: usersData,
          error: usersError,
        } = await supabase
          .from('profiles')
          .select(
            'id,email,full_name,role'
          )
          .order('full_name', {
            ascending: true,
          });

        if (usersError) {
          throw usersError;
        }

        setUsers(
          (usersData ?? []) as Profile[]
        );

        // ==========================================
        // LOAD EVENTS
        // ==========================================

        const {
          data: eventsData,
          error: eventsError,
        } = await supabase
          .from('events')
          .select(
            'id,event_code,title,venue,description,start_time,end_time,status,created_by'
          )
          .order('start_time', {
            ascending: false,
          });

        if (eventsError) {
          throw eventsError;
        }

        setEvents(
          (eventsData ?? []) as Event[]
        );

        // ==========================================
        // LOAD ATTENDANCE
        // ==========================================

        const {
          data: attendanceData,
          error: attendanceError,
        } = await supabase
          .from('attendance')
          .select(
            'id,student_id,event_id,status,scanned_at'
          )
          .order('scanned_at', {
            ascending: false,
          });

        if (attendanceError) {
          throw attendanceError;
        }

        const attendanceRows =
          (attendanceData ?? []) as Attendance[];

        const studentIds = [
          ...new Set(
            attendanceRows.map(
              (item) =>
                item.student_id
            )
          ),
        ];

        const eventIds = [
          ...new Set(
            attendanceRows.map(
              (item) =>
                item.event_id
            )
          ),
        ];

        // ==========================================
        // LOAD STUDENTS
        // ==========================================

        let studentProfiles:
          Profile[] = [];

        if (studentIds.length > 0) {
          const {
            data: studentData,
            error: studentError,
          } = await supabase
            .from('profiles')
            .select(
              'id,email,full_name,role'
            )
            .in(
              'id',
              studentIds
            );

          if (studentError) {
            throw studentError;
          }

          studentProfiles =
            (studentData ?? []) as Profile[];
        }

        // ==========================================
        // LOAD ATTENDANCE EVENTS
        // ==========================================

        let attendanceEvents:
          Event[] = [];

        if (eventIds.length > 0) {
          const {
            data: eventData,
            error: eventError,
          } = await supabase
            .from('events')
            .select(
              'id,event_code,title,venue,description,start_time,end_time,status,created_by'
            )
            .in(
              'id',
              eventIds
            );

          if (eventError) {
            throw eventError;
          }

          attendanceEvents =
            (eventData ?? []) as Event[];
        }

        // ==========================================
        // FORMAT ATTENDANCE
        // ==========================================

        const attendanceDisplay:
          AttendanceDisplay[] =
          attendanceRows.map(
            (record) => {
              const student =
                studentProfiles.find(
                  (item) =>
                    item.id ===
                    record.student_id
                );

              const event =
                attendanceEvents.find(
                  (item) =>
                    item.id ===
                    record.event_id
                );

              return {
                ...record,

                studentName:
                  student?.full_name ??
                  'Unknown Student',

                studentEmail:
                  student?.email ??
                  'No email',

                eventTitle:
                  event?.title ??
                  'Unknown Event',
              };
            }
          );

        setAttendance(
          attendanceDisplay
        );
      } catch (err: any) {
        console.error(
          'Dashboard loading error:',
          err
        );

        setError(
          err?.message ??
            'Unable to load admin dashboard.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  // ==========================================
  // CHANGE USER ROLE
  // ==========================================

  const changeUserRole = (
    user: Profile
  ) => {
    console.log(
      'CHANGE ROLE BUTTON PRESSED:',
      user.email
    );

    if (user.role === 'admin') {
      Alert.alert(
        'Administrator',
        'Administrator accounts cannot be changed from this screen.'
      );

      return;
    }

    Alert.alert(
      'Change Role',
      `${user.full_name ?? user.email}\n\nCurrent role: ${user.role}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Student',
          onPress: () => {
            console.log(
              'STUDENT SELECTED'
            );

            updateUserRole(
              user,
              'student'
            );
          },
        },

        {
          text: 'Teacher',
          onPress: () => {
            console.log(
              'TEACHER SELECTED'
            );

            updateUserRole(
              user,
              'teacher'
            );
          },
        },
      ]
    );
  };

  // ==========================================
  // UPDATE USER ROLE
  // ==========================================

  const updateUserRole =
    async (
      user: Profile,
      newRole:
        | 'student'
        | 'teacher'
    ) => {
      try {
        console.log(
          'Changing role:',
          user.id,
          user.email,
          'from',
          user.role,
          'to',
          newRole
        );

        const {
          data: authData,
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!authData.user) {
          throw new Error(
            'You are not logged in.'
          );
        }

        console.log(
          'Logged-in user:',
          authData.user.id
        );

        const {
          data: adminProfile,
          error:
            adminProfileError,
        } = await supabase
          .from('profiles')
          .select(
            'id,email,full_name,role'
          )
          .eq(
            'id',
            authData.user.id
          )
          .single();

        if (adminProfileError) {
          throw adminProfileError;
        }

        console.log(
          'ADMIN PROFILE:',
          adminProfile
        );

        if (
          adminProfile?.role !==
          'admin'
        ) {
          throw new Error(
            'Your account is not an administrator.'
          );
        }

        const {
          data,
          error,
        } = await supabase
          .from('profiles')
          .update({
            role: newRole,
          })
          .eq(
            'id',
            user.id
          )
          .select(
            'id,email,full_name,role'
          );

        console.log(
          'ROLE UPDATE RESULT:',
          data
        );

        console.log(
          'ROLE UPDATE ERROR:',
          error
        );

        if (error) {
          throw error;
        }

        if (
          !data ||
          data.length === 0
        ) {
          throw new Error(
            'No user was updated. Your Supabase RLS policy may be blocking the update.'
          );
        }

        Alert.alert(
          'Success',
          `${user.full_name ?? user.email} is now a ${newRole}.`
        );

        await loadDashboard();
      } catch (err: any) {
        console.error(
          'ROLE UPDATE ERROR:',
          err
        );

        Alert.alert(
          'Role Update Error',
          err?.message ??
            'Unable to update user role.'
        );
      }
    };

  // ==========================================
  // EDIT EVENT
  // ==========================================

  const editEvent = (
    event: Event
  ) => {
    setEditingEvent(event);

    setEditTitle(
      event.title ?? ''
    );

    setEditVenue(
      event.venue ?? ''
    );

    setEditDescription(
      event.description ?? ''
    );
  };

  // ==========================================
  // SAVE EVENT
  // ==========================================

  const saveEditedEvent =
    async () => {
      if (!editingEvent) {
        return;
      }

      if (!editTitle.trim()) {
        Alert.alert(
          'Missing Title',
          'Please enter an event title.'
        );

        return;
      }

      try {
        setSavingEvent(true);

        const {
          data,
          error,
        } = await supabase
          .from('events')
          .update({
            title:
              editTitle.trim(),

            venue:
              editVenue.trim() ||
              null,

            description:
              editDescription.trim() ||
              null,
          })
          .eq(
            'id',
            editingEvent.id
          )
          .select();

        if (error) {
          throw error;
        }

        if (
          !data ||
          data.length === 0
        ) {
          throw new Error(
            'Event was not updated. Check your Supabase RLS policies.'
          );
        }

        setEditingEvent(null);
        setEditTitle('');
        setEditVenue('');
        setEditDescription('');

        Alert.alert(
          'Success',
          'Event updated successfully.'
        );

        await loadDashboard();
      } catch (err: any) {
        console.error(
          'Edit event error:',
          err
        );

        Alert.alert(
          'Edit Event Error',
          err?.message ??
            'Unable to edit event.'
        );
      } finally {
        setSavingEvent(false);
      }
    };

  // ==========================================
  // DELETE EVENT
  // ==========================================

  const deleteEvent = (
    event: Event
  ) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?\n\nAll attendance records for this event will also be deleted.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Delete',
          style: 'destructive',

          onPress: () =>
            confirmDeleteEvent(
              event
            ),
        },
      ]
    );
  };

  const confirmDeleteEvent =
    async (
      event: Event
    ) => {
      try {
        const {
          error:
            attendanceDeleteError,
        } = await supabase
          .from('attendance')
          .delete()
          .eq(
            'event_id',
            event.id
          );

        if (
          attendanceDeleteError
        ) {
          throw attendanceDeleteError;
        }

        const {
          data,
          error,
        } = await supabase
          .from('events')
          .delete()
          .eq(
            'id',
            event.id
          )
          .select();

        if (error) {
          throw error;
        }

        if (
          !data ||
          data.length === 0
        ) {
          throw new Error(
            'Event was not deleted. Check your Supabase RLS policies.'
          );
        }

        Alert.alert(
          'Success',
          'Event deleted successfully.'
        );

        await loadDashboard();
      } catch (err: any) {
        console.error(
          'Delete event error:',
          err
        );

        Alert.alert(
          'Delete Event Error',
          err?.message ??
            'Unable to delete event.'
        );
      }
    };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout =
    async () => {
      if (loggingOut) {
        return;
      }

      console.log(
        '=============================='
      );

      console.log(
        'LOGOUT BUTTON PRESSED'
      );

      console.log(
        '=============================='
      );

      setLoggingOut(true);

      try {
        console.log(
          'LOGOUT: CALLING SUPABASE SIGNOUT'
        );

        const {
          error: signOutError,
        } =
          await supabase.auth.signOut();

        if (signOutError) {
          console.error(
            'LOGOUT: SIGNOUT ERROR:',
            signOutError.message
          );

          Alert.alert(
            'Logout Error',
            signOutError.message
          );

          return;
        }

        console.log(
          'LOGOUT: SUPABASE SIGNOUT SUCCESS'
        );

        const {
          data: sessionData,
        } =
          await supabase.auth.getSession();

        console.log(
          'LOGOUT: SESSION AFTER SIGNOUT:',
          sessionData.session
            ? 'STILL ACTIVE'
            : 'NO SESSION'
        );

        if (
          sessionData.session
        ) {
          console.error(
            'LOGOUT: SESSION STILL EXISTS'
          );

          Alert.alert(
            'Logout Failed',
            'The session is still active. Please try again.'
          );

          return;
        }

        console.log(
          'LOGOUT: SESSION CLEARED'
        );

        console.log(
          'LOGOUT: REDIRECTING TO LOGIN'
        );

        router.replace(
          '/login'
        );
      } catch (err: any) {
        console.error(
          'LOGOUT: EXCEPTION:',
          err
        );

        Alert.alert(
          'Logout Error',
          err?.message ??
            'Unable to logout.'
        );
      } finally {
        setLoggingOut(false);
      }
    };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (
    value: string | null
  ) => {
    if (!value) {
      return 'N/A';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString();
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading admin dashboard...
        </Text>
      </View>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <View
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
          />
        }
      >
        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <View>
            <Text
              style={
                styles.headerTitle
              }
            >
              Admin Dashboard
            </Text>

            <Text
              style={
                styles.headerSubtitle
              }
            >
              Manage users, events, and attendance
            </Text>
          </View>

          <Pressable
            style={
              styles.logoutButton
            }
            onPress={
              handleLogout
            }
            disabled={
              loggingOut
            }
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#ffffff"
            />

            <Text
              style={
                styles.logoutText
              }
            >
              {loggingOut
                ? 'Logging out...'
                : 'Logout'}
            </Text>
          </Pressable>
        </View>

        {/* ERROR */}

        {error && (
          <View
            style={
              styles.errorBox
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color="#dc2626"
            />

            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>
          </View>
        )}

        {/* ======================================
            USER MANAGEMENT
        ====================================== */}

        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                User Management
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Change student and teacher roles
              </Text>
            </View>

            <View
              style={
                styles.countBadge
              }
            >
              <Text
                style={
                  styles.countText
                }
              >
                {users.length}
              </Text>
            </View>
          </View>

          {users.length === 0 ? (
            <View
              style={
                styles.emptyCard
              }
            >
              <Ionicons
                name="people-outline"
                size={40}
                color="#9ca3af"
              />

              <Text
                style={
                  styles.emptyText
                }
              >
                No users found.
              </Text>
            </View>
          ) : (
            users.map(
              (user) => (
                <View
                  key={user.id}
                  style={
                    styles.card
                  }
                >
                  <View
                    style={
                      styles.cardTop
                    }
                  >
                    <View
                      style={
                        styles.avatar
                      }
                    >
                      <Ionicons
                        name="person"
                        size={22}
                        color="#2563eb"
                      />
                    </View>

                    <View
                      style={
                        styles.userInfo
                      }
                    >
                      <Text
                        style={
                          styles.userName
                        }
                      >
                        {user.full_name ??
                          'No Name'}
                      </Text>

                      <Text
                        style={
                          styles.userEmail
                        }
                      >
                        {user.email ??
                          'No Email'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.roleBadge,

                        user.role ===
                        'admin'
                          ? styles.adminBadge
                          : user.role ===
                            'teacher'
                          ? styles.teacherBadge
                          : styles.studentBadge,
                      ]}
                    >
                      <Text
                        style={
                          styles.roleText
                        }
                      >
                        {user.role.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {user.role !==
                    'admin' && (
                    <Pressable
                      style={
                        styles.blueButton
                      }
                      onPress={() => {
                        changeUserRole(
                          user
                        );
                      }}
                    >
                      <Ionicons
                        name="swap-horizontal"
                        size={18}
                        color="#ffffff"
                      />

                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        CHANGE ROLE
                      </Text>
                    </Pressable>
                  )}
                </View>
              )
            )
          )}
        </View>

        {/* ======================================
            EVENT MANAGEMENT
        ====================================== */}

        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Event Management
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Edit or delete attendance events
              </Text>
            </View>

            <View
              style={
                styles.countBadge
              }
            >
              <Text
                style={
                  styles.countText
                }
              >
                {events.length}
              </Text>
            </View>
          </View>

          {events.length === 0 ? (
            <View
              style={
                styles.emptyCard
              }
            >
              <Ionicons
                name="calendar-outline"
                size={40}
                color="#9ca3af"
              />

              <Text
                style={
                  styles.emptyText
                }
              >
                No events found.
              </Text>
            </View>
          ) : (
            events.map(
              (event) => (
                <View
                  key={event.id}
                  style={
                    styles.card
                  }
                >
                  <View
                    style={
                      styles.eventHeader
                    }
                  >
                    <View
                      style={
                        styles.eventIcon
                      }
                    >
                      <Ionicons
                        name="calendar"
                        size={22}
                        color="#2563eb"
                      />
                    </View>

                    <View
                      style={
                        styles.eventInfo
                      }
                    >
                      <Text
                        style={
                          styles.eventTitle
                        }
                      >
                        {event.title}
                      </Text>

                      {event.event_code && (
                        <Text
                          style={
                            styles.eventCode
                          }
                        >
                          Code:{' '}
                          {
                            event.event_code
                          }
                        </Text>
                      )}
                    </View>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#6b7280"
                    />

                    <Text
                      style={
                        styles.detailText
                      }
                    >
                      {event.venue ??
                        'No venue'}
                    </Text>
                  </View>

                  {event.description && (
                    <Text
                      style={
                        styles.description
                      }
                    >
                      {
                        event.description
                      }
                    </Text>
                  )}

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color="#6b7280"
                    />

                    <Text
                      style={
                        styles.detailText
                      }
                    >
                      {formatDate(
                        event.start_time
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.buttonRow
                    }
                  >
                    <Pressable
                      style={
                        styles.editButton
                      }
                      onPress={() =>
                        editEvent(
                          event
                        )
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color="#ffffff"
                      />

                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        EDIT
                      </Text>
                    </Pressable>

                    <Pressable
                      style={
                        styles.redButton
                      }
                      onPress={() =>
                        deleteEvent(
                          event
                        )
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color="#ffffff"
                      />

                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        DELETE
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )
            )
          )}
        </View>

        {/* ======================================
            ATTENDANCE RECORDS
        ====================================== */}

        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Attendance Records
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                View student attendance
              </Text>
            </View>

            <View
              style={
                styles.countBadge
              }
            >
              <Text
                style={
                  styles.countText
                }
              >
                {attendance.length}
              </Text>
            </View>
          </View>

          {attendance.length ===
          0 ? (
            <View
              style={
                styles.emptyCard
              }
            >
              <Ionicons
                name="checkmark-done-outline"
                size={40}
                color="#9ca3af"
              />

              <Text
                style={
                  styles.emptyText
                }
              >
                No attendance records found.
              </Text>
            </View>
          ) : (
            attendance.map(
              (record) => (
                <View
                  key={record.id}
                  style={
                    styles.card
                  }
                >
                  <View
                    style={
                      styles.attendanceHeader
                    }
                  >
                    <View
                      style={
                        styles.avatar
                      }
                    >
                      <Ionicons
                        name="person-outline"
                        size={21}
                        color="#2563eb"
                      />
                    </View>

                    <View
                      style={
                        styles.userInfo
                      }
                    >
                      <Text
                        style={
                          styles.userName
                        }
                      >
                        {
                          record.studentName
                        }
                      </Text>

                      <Text
                        style={
                          styles.userEmail
                        }
                      >
                        {
                          record.studentEmail
                        }
                      </Text>
                    </View>

                    <View
                      style={
                        styles.presentBadge
                      }
                    >
                      <Text
                        style={
                          styles.presentText
                        }
                      >
                        {(
                          record.status ??
                          'present'
                        ).toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#6b7280"
                    />

                    <Text
                      style={
                        styles.detailText
                      }
                    >
                      {
                        record.eventTitle
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color="#6b7280"
                    />

                    <Text
                      style={
                        styles.detailText
                      }
                    >
                      {formatDate(
                        record.scanned_at
                      )}
                    </Text>
                  </View>
                </View>
              )
            )
          )}
        </View>

        {/* ======================================
            REPORTS
        ====================================== */}

        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Reports
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Dashboard summary
              </Text>
            </View>

            <Ionicons
              name="bar-chart-outline"
              size={26}
              color="#2563eb"
            />
          </View>

          <View
            style={
              styles.statsContainer
            }
          >
            <View
              style={
                styles.statCard
              }
            >
              <Ionicons
                name="people-outline"
                size={28}
                color="#2563eb"
              />

              <Text
                style={
                  styles.statNumber
                }
              >
                {users.length}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Users
              </Text>
            </View>

            <View
              style={
                styles.statCard
              }
            >
              <Ionicons
                name="calendar-outline"
                size={28}
                color="#2563eb"
              />

              <Text
                style={
                  styles.statNumber
                }
              >
                {events.length}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Events
              </Text>
            </View>

            <View
              style={
                styles.statCard
              }
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={28}
                color="#2563eb"
              />

              <Text
                style={
                  styles.statNumber
                }
              >
                {attendance.length}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Attendance
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ==========================================
          EDIT EVENT MODAL
      ========================================== */}

      <Modal
        visible={
          editingEvent !== null
        }
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!savingEvent) {
            setEditingEvent(
              null
            );
          }
        }}
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalContainer
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Edit Event
              </Text>

              <Pressable
                onPress={() => {
                  if (
                    !savingEvent
                  ) {
                    setEditingEvent(
                      null
                    );
                  }
                }}
                disabled={
                  savingEvent
                }
              >
                <Ionicons
                  name="close"
                  size={28}
                  color="#374151"
                />
              </Pressable>
            </View>

            <Text
              style={
                styles.inputLabel
              }
            >
              Event Title
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={editTitle}
              onChangeText={
                setEditTitle
              }
              placeholder="Enter event title"
              placeholderTextColor="#9ca3af"
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              Venue
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={editVenue}
              onChangeText={
                setEditVenue
              }
              placeholder="Enter venue"
              placeholderTextColor="#9ca3af"
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              Description
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              value={
                editDescription
              }
              onChangeText={
                setEditDescription
              }
              placeholder="Enter description"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View
              style={
                styles.modalButtons
              }
            >
              <Pressable
                style={
                  styles.cancelButton
                }
                onPress={() => {
                  if (
                    !savingEvent
                  ) {
                    setEditingEvent(
                      null
                    );
                  }
                }}
                disabled={
                  savingEvent
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  CANCEL
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.saveButton
                }
                onPress={
                  saveEditedEvent
                }
                disabled={
                  savingEvent
                }
              >
                {savingEvent ? (
                  <ActivityIndicator
                    size="small"
                    color="#ffffff"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={18}
                      color="#ffffff"
                    />

                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      SAVE
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f3f4f6',
    },

    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f3f4f6',
    },

    loadingText: {
      marginTop: 12,
      fontSize: 15,
      color: '#6b7280',
    },

    header: {
      backgroundColor: '#1d4ed8',
      borderRadius: 18,
      padding: 20,
      marginBottom: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    headerTitle: {
      color: '#ffffff',
      fontSize: 24,
      fontWeight: '800',
    },

    headerSubtitle: {
      color: '#dbeafe',
      fontSize: 13,
      marginTop: 4,
      maxWidth: 220,
    },

    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#dc2626',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 10,
    },

    logoutText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 12,
    },

    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fee2e2',
      borderWidth: 1,
      borderColor: '#fecaca',
      borderRadius: 12,
      padding: 12,
      marginBottom: 18,
      gap: 8,
    },

    errorText: {
      flex: 1,
      color: '#991b1b',
      fontSize: 13,
    },

    section: {
      marginBottom: 22,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#111827',
    },

    sectionSubtitle: {
      color: '#6b7280',
      fontSize: 13,
      marginTop: 2,
    },

    countBadge: {
      minWidth: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#dbeafe',
      justifyContent: 'center',
      alignItems: 'center',
    },

    countText: {
      color: '#1d4ed8',
      fontWeight: '800',
    },

    card: {
      backgroundColor: '#ffffff',
      borderRadius: 15,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },

    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 13,
    },

    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#dbeafe',
      justifyContent: 'center',
      alignItems: 'center',
    },

    userInfo: {
      flex: 1,
      marginLeft: 11,
    },

    userName: {
      fontSize: 15,
      fontWeight: '700',
      color: '#111827',
    },

    userEmail: {
      fontSize: 12,
      color: '#6b7280',
      marginTop: 2,
    },

    roleBadge: {
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 8,
    },

    adminBadge: {
      backgroundColor: '#ede9fe',
    },

    teacherBadge: {
      backgroundColor: '#dcfce7',
    },

    studentBadge: {
      backgroundColor: '#dbeafe',
    },

    roleText: {
      fontSize: 10,
      fontWeight: '800',
    },

    blueButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 7,
      backgroundColor: '#2563eb',
      paddingVertical: 11,
      borderRadius: 9,
    },

    editButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#2563eb',
      paddingVertical: 11,
      borderRadius: 9,
    },

    redButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#dc2626',
      paddingVertical: 11,
      borderRadius: 9,
    },

    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },

    buttonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },

    eventHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 13,
    },

    eventIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#dbeafe',
      justifyContent: 'center',
      alignItems: 'center',
    },

    eventInfo: {
      flex: 1,
      marginLeft: 11,
    },

    eventTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#111827',
    },

    eventCode: {
      color: '#6b7280',
      fontSize: 12,
      marginTop: 3,
    },

    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },

    detailText: {
      flex: 1,
      color: '#4b5563',
      fontSize: 13,
    },

    description: {
      color: '#4b5563',
      fontSize: 13,
      lineHeight: 19,
      marginTop: 8,
    },

    attendanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },

    presentBadge: {
      backgroundColor: '#dcfce7',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 7,
    },

    presentText: {
      color: '#166534',
      fontSize: 9,
      fontWeight: '800',
    },

    emptyCard: {
      backgroundColor: '#ffffff',
      borderRadius: 15,
      padding: 30,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },

    emptyText: {
      color: '#6b7280',
      marginTop: 10,
      fontSize: 14,
    },

    statsContainer: {
      flexDirection: 'row',
      gap: 10,
    },

    statCard: {
      flex: 1,
      backgroundColor: '#ffffff',
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },

    statNumber: {
      fontSize: 24,
      fontWeight: '800',
      color: '#111827',
      marginTop: 6,
    },

    statLabel: {
      fontSize: 11,
      color: '#6b7280',
      marginTop: 2,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },

    modalContainer: {
      backgroundColor: '#ffffff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 30,
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },

    modalTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#111827',
    },

    inputLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: '#374151',
      marginBottom: 6,
      marginTop: 8,
    },

    input: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 11,
      fontSize: 14,
      color: '#111827',
      backgroundColor: '#ffffff',
    },

    textArea: {
      minHeight: 90,
    },

    modalButtons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 20,
    },

    cancelButton: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#e5e7eb',
      paddingVertical: 13,
      borderRadius: 10,
    },

    cancelButtonText: {
      color: '#374151',
      fontSize: 13,
      fontWeight: '800',
    },

    saveButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#2563eb',
      paddingVertical: 13,
      borderRadius: 10,
    },
  });