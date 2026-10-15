export type QRPayload = {
  v: 1;
  event: string;
};

export function buildQRPayload(
  eventCode: string
) {
  const payload: QRPayload = {
    v: 1,
    event: eventCode,
  };

  return JSON.stringify(
    payload
  );
}

export function parseQRPayload(
  value: string
) {
  try {
    const parsed =
      JSON.parse(value);

    if (
      !parsed ||
      parsed.v !== 1 ||
      typeof parsed.event !==
        'string' ||
      !parsed.event.trim()
    ) {
      return null;
    }

    return {
      v: 1 as const,
      event:
        parsed.event.trim(),
    };
  } catch {
    return null;
  }
}