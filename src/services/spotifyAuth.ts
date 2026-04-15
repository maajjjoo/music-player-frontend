import { spotifyConfig } from '../config/spotify';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const STORAGE_KEYS = {
  accessToken: 'spotify_access_token',
  refreshToken: 'spotify_refresh_token',
  expiresAt: 'spotify_expires_at',
  codeVerifier: 'spotify_code_verifier',
} as const;

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((x) => chars[x % chars.length])
    .join('');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── Auth flow ─────────────────────────────────────────────────────────────────

export async function redirectToSpotifyLogin(): Promise<void> {
  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem(STORAGE_KEYS.codeVerifier, verifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: spotifyConfig.clientId,
    scope: spotifyConfig.scopes,
    redirect_uri: spotifyConfig.redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    show_dialog: 'false',
  });

  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const verifier = localStorage.getItem(STORAGE_KEYS.codeVerifier);
  if (!verifier) throw new Error('No code verifier found');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: spotifyConfig.redirectUri,
    client_id: spotifyConfig.clientId,
    code_verifier: verifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) throw new Error('Token exchange failed');

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  saveTokens(data.access_token, data.refresh_token, data.expires_in);
  localStorage.removeItem(STORAGE_KEYS.codeVerifier);
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  if (!refreshToken) return null;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: spotifyConfig.clientId,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  saveTokens(
    data.access_token,
    data.refresh_token ?? refreshToken,
    data.expires_in
  );

  return data.access_token;
}

export async function getValidAccessToken(): Promise<string | null> {
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  const expiresAt = localStorage.getItem(STORAGE_KEYS.expiresAt);

  if (!token || !expiresAt) return null;

  // Refresh 60 seconds before expiry
  if (Date.now() > parseInt(expiresAt) - 60_000) {
    return refreshAccessToken();
  }

  return token;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.expiresAt);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function saveTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): void {
  localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  localStorage.setItem(
    STORAGE_KEYS.expiresAt,
    String(Date.now() + expiresIn * 1000)
  );
}
