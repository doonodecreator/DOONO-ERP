const STORAGE_KEY = "dono:offline-cbt-answers";
const MUTATION_STORAGE_KEY = "dono:offline-mutations";

function currentAccountKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return String(user?.id || user?.email || "unknown");
  } catch {
    return "unknown";
  }
}

function readQueue() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeQueue(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-500)));
  } catch {
    // If storage is unavailable, the online request path still remains usable.
  }
}

function readMutations() {
  try {
    const value = JSON.parse(localStorage.getItem(MUTATION_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeMutations(entries) {
  try {
    localStorage.setItem(MUTATION_STORAGE_KEY, JSON.stringify(entries.slice(-200)));
  } catch {
    // If storage is unavailable, the online request path still remains usable.
  }
}

function newMutationId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `${prefix}:${crypto.randomUUID()}`;
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

export function queueCbtAnswer(attemptId, payload) {
  const accountKey = currentAccountKey();
  const queue = readQueue().filter((entry) => !(entry.accountKey === accountKey && String(entry.attemptId) === String(attemptId) && String(entry.payload?.assessment_question_id) === String(payload.assessment_question_id)));
  const clientChangedAt = new Date().toISOString();
  queue.push({
    id: `${accountKey}:${attemptId}:${payload.assessment_question_id}`,
    accountKey,
    attemptId,
    payload,
    clientChangedAt,
    queuedAt: clientChangedAt,
  });
  writeQueue(queue);
}

export function queuedCbtAnswers(attemptId) {
  const accountKey = currentAccountKey();
  return readQueue()
    .filter((entry) => entry.accountKey === accountKey && String(entry.attemptId) === String(attemptId))
    .map((entry) => ({ ...entry.payload, client_changed_at: entry.clientChangedAt }))
    .filter((payload) => payload && payload.assessment_question_id);
}

export async function flushCbtAnswerQueue(api) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { sent: 0, conflicts: 0, remaining: readQueue().length };
  const accountKey = currentAccountKey();
  const queue = readQueue();
  const current = queue.filter((entry) => entry.accountKey === accountKey);
  const otherAccounts = queue.filter((entry) => entry.accountKey !== accountKey);
  const remaining = [];
  let sent = 0;
  let conflicts = 0;

  for (const entry of current) {
    try {
      await api.post(`/student/cbt-attempts/${entry.attemptId}/answers`, { ...entry.payload, client_changed_at: entry.clientChangedAt }, { headers: { "Idempotency-Key": `offline-cbt:${entry.id}` } });
      sent += 1;
    } catch (error) {
      if (error?.isNetworkError || !error?.response) remaining.push(entry);
      else if (error?.response?.status === 409) {
        remaining.push({ ...entry, conflict: true, conflictDetail: error.response.data?.data || null });
        conflicts += 1;
      } else if (![401, 403, 404, 422].includes(error?.response?.status)) remaining.push(entry);
    }
  }

  writeQueue([...otherAccounts, ...remaining]);
  return { sent, conflicts, remaining: remaining.length };
}

export function queueAttendanceRegister(payload, idempotencyKey = null) {
  const accountKey = currentAccountKey();
  const queuedAt = new Date().toISOString();
  const id = newMutationId(`attendance:${accountKey}`);
  const queue = readMutations();
  queue.push({
    id,
    kind: "attendance_register",
    accountKey,
    path: "/attendance/bulk",
    payload,
    idempotencyKey: idempotencyKey || `offline-attendance:${id}`,
    queuedAt,
  });
  writeMutations(queue);
  return id;
}

export async function flushAttendanceQueue(api) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { sent: 0, conflicts: 0, remaining: readMutations().length };
  const accountKey = currentAccountKey();
  const queue = readMutations();
  const current = queue.filter((entry) => entry.accountKey === accountKey && entry.kind === "attendance_register");
  const otherAccounts = queue.filter((entry) => entry.accountKey !== accountKey || entry.kind !== "attendance_register");
  const remaining = [];
  let sent = 0;
  let conflicts = 0;

  for (const entry of current) {
    try {
      await api.post(entry.path, entry.payload, { headers: { "Idempotency-Key": entry.idempotencyKey } });
      sent += 1;
    } catch (error) {
      if (error?.isNetworkError || !error?.response) remaining.push(entry);
      else if (error?.response?.status === 409) {
        remaining.push({ ...entry, conflict: true, conflictDetail: error.response.data?.data || null });
        conflicts += 1;
      } else if (![401, 403, 404, 422].includes(error?.response?.status)) {
        remaining.push(entry);
      }
    }
  }

  writeMutations([...otherAccounts, ...remaining]);
  return { sent, conflicts, remaining: remaining.length };
}
