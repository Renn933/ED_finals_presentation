import {
  supabase,
} from './supabase';

import {
  getEventByCode,
  type Event,
} from './events';

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'excused'
  | 'absent';

export type Attendance = {
  id: string;
  student_id: string;
  event_id: string;
  scanned_at: string;
  status: AttendanceStatus;
  event?: Event;
};

export async function registerAttendance(
  eventCode: string
) {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: new Error(
        'You must be logged in.'
      ),
    };
  }

  const {
    data: profile,
  } =
    await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

  if (
    profile?.role !==
    'student'
  ) {
    return {
      data: null,
      error: new Error(
        'Only students can record attendance.'
      ),
    };
  }

  const {
    data: event,
    error: eventError,
  } =
    await getEventByCode(
      eventCode
    );

  if (eventError) {
    return {
      data: null,
      error: eventError,
    };
  }

  if (!event) {
    return {
      data: null,
      error: new Error(
        'Invalid QR code. Event not found.'
      ),
    };
  }

  if (
    event.status !== 'open'
  ) {
    return {
      data: null,
      error: new Error(
        'Attendance is closed for this event.'
      ),
    };
  }

  const now =
    new Date();

  const start =
    new Date(
      event.start_time
    );

  const end =
    new Date(
      event.end_time
    );

  if (now < start) {
    return {
      data: null,
      error: new Error(
        'This event has not started yet.'
      ),
    };
  }

  if (now > end) {
    return {
      data: null,
      error: new Error(
        'This event has already ended.'
      ),
    };
  }

  const {
    data: existing,
    error: existingError,
  } =
    await supabase
      .from('attendance')
      .select('id')
      .eq(
        'student_id',
        user.id
      )
      .eq(
        'event_id',
        event.id
      )
      .maybeSingle();

  if (existingError) {
    return {
      data: null,
      error: existingError,
    };
  }

  if (existing) {
    return {
      data: null,
      error: new Error(
        'You already attended this event.'
      ),
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from('attendance')
      .insert({
        student_id: user.id,
        event_id: event.id,
        scanned_at:
          new Date().toISOString(),
        status: 'present',
      })
      .select()
      .single();

  return {
    data,
    error,
  };
}

export async function getMyAttendance() {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: new Error(
        'You must be logged in.'
      ),
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from('attendance')
      .select(`
        *,
        event:events(*)
      `)
      .eq(
        'student_id',
        user.id
      )
      .order(
        'scanned_at',
        {
          ascending: false,
        }
      );

  return {
    data: data as Attendance[] | null,
    error,
  };
}

export async function getAttendanceForEvent(
  eventId: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from('attendance')
      .select(`
        *,
        profile:profiles(
          id,
          email,
          full_name,
          role
        )
      `)
      .eq(
        'event_id',
        eventId
      )
      .order(
        'scanned_at',
        {
          ascending: true,
        }
      );

  return {
    data,
    error,
  };
}

export async function getAllAttendance() {
  const {
    data,
    error,
  } =
    await supabase
      .from('attendance')
      .select(`
        *,
        profile:profiles(
          id,
          email,
          full_name,
          role
        ),
        event:events(
          id,
          event_code,
          title,
          venue,
          start_time,
          end_time,
          status
        )
      `)
      .order(
        'scanned_at',
        {
          ascending: false,
        }
      );

  return {
    data,
    error,
  };
}

export async function deleteAttendance(
  attendanceId: string
) {
  const {
    error,
  } =
    await supabase
      .from('attendance')
      .delete()
      .eq(
        'id',
        attendanceId
      );

  return {
    error,
  };
}

export async function updateAttendanceStatus(
  attendanceId: string,
  status: AttendanceStatus
) {
  const {
    data,
    error,
  } =
    await supabase
      .from('attendance')
      .update({
        status,
      })
      .eq(
        'id',
        attendanceId
      )
      .select()
      .single();

  return {
    data,
    error,
  };
}