export function arrayFromResponse(response) {
  const candidates = [
    response?.data?.data?.data,
    response?.data?.data,
    response?.data,
    response?.data?.items,
    response?.items,
    response,
  ];

  return candidates.find((candidate) => Array.isArray(candidate)) || [];
}

export function paginatedFromResponse(response) {
  const payload = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(payload)) return { data: payload, meta: null };
  if (Array.isArray(payload?.data)) return { data: payload.data, meta: payload };
  if (Array.isArray(payload?.items)) return { data: payload.items, meta: payload };
  return { data: [], meta: null };
}
