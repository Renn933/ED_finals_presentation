import {
  supabase,
} from './supabase';

export type EventStatus =
  | 'open'
  | 'closed';

export type Event = {
  id: string;
  event_code: string;
  title: string;
  start_time: string;
  end_time: string;
  venue: string;
  description: string | null;
  status: EventStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CreateEventInput = {
  event_code: string;
  title: string;
  start_time: string;
  end_time: string;
  venue: string;
  description?: string;
};

export async function createEvent(
  input: CreateEventInput
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
    data,
    error,
  } =
    await supabase
      .from('events')
      .insert({
        event_code:
          input.event_code.trim(),
        title:
          input.title.trim(),
        start_time:
          input.start_time,
        end_time:
          input.end_time,
        venue:
          input.venue.trim(),
        description:
          input.description?.trim() ||
          null,
        status: 'open',
        created_by: user.id,
      })
      .select()
      .single();

  return {
    data: data as Event | null,
    error,
  };
}

export async function getAllEvents() {
  const {
    data,
    error,
  } =
    await supabase
      .from('events')
      .select('*')
      .order('start_time', {
        ascending: true,
      });

  return {
    data: data as Event[] | null,
    error,
  };
}

export async function getTeacherEvents() {
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
      .from('events')
      .select('*')
      .eq(
        'created_by',
        user.id
      )
      .order('start_time', {
        ascending: true,
      });

  return {
    data: data as Event[] | null,
    error,
  };
}

export async function getEventByCode(
  eventCode: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from('events')
      .select('*')
      .eq(
        'event_code',
        eventCode
      )
      .maybeSingle();

  return {
    data: data as Event | null,
    error,
  };
}

export async function updateEvent(
  eventId: string,
  input: Partial<CreateEventInput>
) {
  const updateData: Record<
    string,
    unknown
  > = {};

  if (
    input.event_code !== undefined
  ) {
    updateData.event_code =
      input.event_code.trim();
  }

  if (
    input.title !== undefined
  ) {
    updateData.title =
      input.title.trim();
  }

  if (
    input.start_time !==
    undefined
  ) {
    updateData.start_time =
      input.start_time;
  }

  if (
    input.end_time !==
    undefined
  ) {
    updateData.end_time =
      input.end_time;
  }

  if (
    input.venue !== undefined
  ) {
    updateData.venue =
      input.venue.trim();
  }

  if (
    input.description !==
    undefined
  ) {
    updateData.description =
      input.description.trim() ||
      null;
  }

  updateData.updated_at =
    new Date().toISOString();

  const {
    data,
    error,
  } =
    await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

  return {
    data: data as Event | null,
    error,
  };
}

export async function closeEvent(
  eventId: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from('events')
      .update({
        status: 'closed',
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single();

  return {
    data: data as Event | null,
    error,
  };
}

export async function deleteEvent(
  eventId: string
) {
  const {
    error,
  } =
    await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

  return {
    error,
  };
}