export const spotifyConfig = {
  clientId: import.meta.env['VITE_SPOTIFY_CLIENT_ID'] as string,
  redirectUri: import.meta.env['VITE_SPOTIFY_REDIRECT_URI'] as string,
  scopes: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
  ].join(' '),
};
