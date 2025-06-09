# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your Supabase credentials and Stripe secret key

   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and replace the placeholder values for
   `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` and
   `STRIPE_SECRET_KEY`.
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

Stripe is used for payment processing. Provide your `STRIPE_SECRET_KEY` in `.env` and run `npm run schedule-charges` via cron to bill tenants.


When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Payments

Stripe is used for payment processing. Provide your `STRIPE_SECRET_KEY` in `.env` and run `npm run schedule-charges` via cron to bill tenants.


## Supabase Schema

The `supabase` directory contains SQL for additional tables used by the app. Run
the SQL in `supabase/schema.sql` on your project to create all the required
tables. The script defines `user_roles` plus new tables for `complexes`,
`clients`, `units` and `payments`. Foreign keys link these tables to
`auth.users` and each other and the script uses `CREATE TABLE IF NOT EXISTS` to
avoid duplicates. If you previously created older versions of these tables,
drop them before running the updated SQL.

### Admin pages

Admin functionality lives in `app/(web)/admin.tsx`. There isn't an `app/admin` folder in this project. Users without the admin role visiting this page will see an "Access denied" message.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
