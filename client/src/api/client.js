const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`);
  } catch (err) {
    // Network-level failure: backend down, CORS blocked, DNS, etc.
    throw new ApiError('Could not reach the server. Is the API running?', 0);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore parse failure, use default message */
    }
    throw new ApiError(message, response.status);
  }

  return response.json();
}

export const api = {
  health: () => request('/api/health'),
  search: (term) => request(`/api/search?q=${encodeURIComponent(term)}`),
  getPlayer: (id) => request(`/api/players/${encodeURIComponent(id)}`),
  getClub: (id) => request(`/api/clubs/${encodeURIComponent(id)}`),
  findConnection: (fromId, toId) =>
    request(`/api/connections?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}`),
};

export { ApiError };
