# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

Make sure Node.js 18 is active by running `nvm use` or installing Node 18.

1. Install dependencies

   ```bash
   npm install
   ```
    **Note**: Expo SDK 53 currently supports Node.js versions 18 and 20. Other
   versions may cause the CLI to fail.

2. Copy `.env.example` to `.env` and add your Supabase credentials and Stripe secrets

   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and replace the placeholder values for
   `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and optionally `APP_BASE_URL`.
3. Start the app


   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Payments

Start the backend server before using the checkout screen:

```bash
npm run start-server
```

 run via cron to bill tenants.
Set `EXPO_PUBLIC_API_URL` in `.env` to the URL of this server. The mobile app will call `/payments/checkout` on this endpoint which uses the Stripe secrets from `.env`. `npm run schedule-charges` can still be run via cron to bill tenants.


## Supabase Schema

SQL in `supabase/schema.sql` on your project to create the required schema. You
can execute the file in the Supabase SQL editor or with the CLI:

```bash
supabase db execute --file supabase/schema.sql
```

The script defines the user management tables along with `complexes`, `clients`,
`units`, `installments`, `payments` and `subscriptions`. Foreign keys link these
tables together and the script uses `CREATE TABLE IF NOT EXISTS` to avoid
duplicates. If you previously created older versions of these tables, drop them
before running the updated SQL.


### Admin pages

Admin functionality lives in the `(web)` directory. Visit `/(web)` to access the dashboard with links to `users`, `complexes` and `units` management screens. These pages require the admin role and use `useAuthorization` to block unauthorized users.
## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
