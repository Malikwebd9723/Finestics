// App configuration.
//
// To point the app at a local backend, create a `.env` file (gitignored) with:
//   EXPO_PUBLIC_API_URL=http://<your-lan-ip-or-10.0.2.2>:<port>/api/v1
// then restart the dev server. Without it, the app talks to production.
export const config = {
  BaseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.finestics.com/api/v1',
};
