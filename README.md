# Thần Dò Số · Mobile App

Thần Dò Số is a React Native app for looking up Vietnamese lottery results and managing saved tickets. It connects to the companion [Thần Dò Số API](https://github.com/ndthang0000/api-than-do-so), which handles ticket checks and result retrieval.

## Explore the app

- [My Tickets](app/screens/MyTicket.tsx) — view saved tickets.
- [Manual input](app/screens/ManualInputScreen.tsx) — enter ticket details in the app.
- [Results](app/screens/NorthResult.tsx) and [lottery schedule](app/screens/LotteryScheduleScreen.tsx) — browse results and draw schedules.

To explore the ticket workflow across both repositories, start at the ticket screens above, then open the [ticket endpoints in the API README](https://github.com/ndthang0000/api-than-do-so#api-endpoints).

## Run locally

This project uses TypeScript, React Native, Expo and the [Ignite](https://github.com/infinitered/ignite) starter. Use Node.js 22 with npm and set up Android Studio for Android or Xcode on macOS for iOS.

1. Install dependencies.

   ```sh
   npm ci --legacy-peer-deps
   ```

2. Start the [companion API](https://github.com/ndthang0000/api-than-do-so#run-locally) and set `API_URL` in [the development config](app/config/config.dev.ts) to its base URL, including the `/api` prefix. Use an address reachable from the device or simulator.
3. Build and launch the native development app with `npm run android` or `npm run ios`. To start Metro separately for an installed development build, run `npm start`.

## Project checks

```sh
npm run compile
npm run lint:check
npm test
```
