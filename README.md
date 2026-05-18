# A Campingflight To…

PWA voor het organiseren van kampeer- en bergtrips: paklijsten, boodschappen, campings, wishlist, knopen, en weersvoorspellingen.

Gebouwd met **Next.js 16 + Tailwind v4 + Firebase Firestore**. Live op Vercel.

---

## Architectuur in het kort

### Multi-tenancy (groepen)

Elke "groep" is een gedeelde workspace — bijvoorbeeld jij + je partner, of een gezin, of een vriendengroep. Alle data is per groep gescheiden.

```
Firestore:
  groups/{groupId}                 ← metadata: naam, inviteCode, members[]
    └─ data/items                  ← paklijst-spullen
    └─ data/tips                   ← knopen, koken, bergen
    └─ data/state                  ← afvinkingen + tripConfig
    └─ data/groceries              ← boodschappen
    └─ data/locations              ← campings
    └─ data/wishlist               ← wishlist-plekken
```

**Login-flow** (3 paden):
1. **Resume** — apparaat onthoudt `{ groupId, memberName }` in `localStorage`
2. **Join** — invite-code invoeren (bijv. `BERG-2745`) + je naam → toegevoegd als lid
3. **Create** — alleen voor admin (jij): admin-PIN + groepsnaam + jouw naam → krijgt een gegenereerde code

**Security model:**
- Group-creatie gaat via `/api/admin/create-group` met een server-side `ADMIN_PIN` env var. Firestore rules blokkeren client-side `create` op `/groups/*`.
- Joinen, lezen en data-mutaties gaan rechtstreeks vanuit de client. Wie de invite-code kent komt erin.

### Default data is single source of truth

`src/lib/defaultData.ts` bevat alle standaard paklijst-items en tips (knopen etc.). Bij elke app-load synchroniseert `fetchItems()` / `fetchTips()` deze defaults met Firestore via een generieke helper:

- **Default items/tips** worden automatisch ge-update naar wat in code staat (alle velden)
- **Custom items/tips** (door gebruiker toegevoegd) blijven onaangeraakt
- **Verwijderde defaults** (tracked in `deletedDefaultIds`) komen niet vanzelf terug

Resultaat: een nieuw veld op een default in `defaultData.ts` propageert automatisch naar alle bestaande groepen bij hun volgende load.

---

## Hoe wijzig ik de standaardlijst?

Alles wat "standaard" is — paklijst-items, knoop-tips, kook-tips, bergen-tips — staat in `src/lib/defaultData.ts`. Dat bestand is **single source of truth**.

### Een knoop toevoegen

```ts
// in src/lib/defaultData.ts, in DEFAULT_TIPS array:
{
  id: 't21',                              // verzin een uniek id (niet hergebruiken!)
  title: 'Achtknoop',
  category: 'Knopen',
  knotIcon: 'figure-8-knot',              // moet matchen met knots3d.com slug
  imageUrl: '/knots/achtknoop.png',       // optioneel — zet bestand in /public/knots/
  // linkUrl: 'https://...'               // optioneel — overschrijft knots3d link
  content: 'De achtknoop is een stopperknoop...\n\n1. Maak een lus\n2. ...',
},
```

Commit + push → Vercel deployt → bij volgende app-load van elke groep wordt de nieuwe tip automatisch toegevoegd aan hun lijst.

### Een paklijst-item toevoegen

```ts
// in DEFAULT_ITEMS:
{ id: 'c15', name: 'Zonnehoed kinderen', category: 'Kleding',
  tripTypes: ['weekend', 'week'], mountains: false, kids: true },
```

### Een bestaande default aanpassen

Verander gewoon het veld in `defaultData.ts` en push. Bij volgende app-load:
- Het veld wordt voor alle groepen ge-update
- User-edits op default items/tips worden **wel** overschreven (code wint)
- User-toegevoegde `quantity`/`notes` op default items blijven behouden

### ⚠️ Belangrijke regels

1. **Hergebruik nooit een bestaande `id`** voor een ander item. Als je `t8` (bliksem) hergebruikt voor een nieuwe tip, verlies je oude data van groepen die `t8` al hadden.
2. **Verwijder geen `id`** uit `defaultData.ts` als je hem wilt "uitschakelen". Voeg hem in plaats daarvan toe aan `RETIRED_TIP_IDS` (in `src/lib/firestore.ts`) — dan wordt hij netjes opgeruimd zonder andere data te beschadigen.
3. **Test lokaal** met `npm run dev` voor je pusht. Bij ernstige bugs kan een verkeerde migratie data corrumperen in Firestore.
4. **Backup eerst** (optioneel) als je grote wijzigingen doet — exporteer je Firestore via Firebase Console.

### Hoe weet ik of mijn wijziging is doorgekomen?

1. Push naar `main`
2. Wacht tot Vercel deploy klaar is (~30 sec)
3. Open de app op een apparaat met een actieve sessie
4. Hard refresh (Cmd+Shift+R of trek omlaag in PWA)
5. De nieuwe tip / het nieuwe item zou er moeten zijn

Bij twijfel kun je in de Firebase Console kijken naar `groups/{groupId}/data/items` of `/tips` om te zien wat er nu écht in Firestore staat.

---

## Lokaal draaien

### Env vars (in `.env.local`)

```bash
# Firebase client SDK (lees-data toegang)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Admin (server-side, alleen voor groep-creatie)
ADMIN_PIN=jouw-geheime-pin
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

Het `FIREBASE_SERVICE_ACCOUNT` JSON haal je uit Firebase Console → Project settings → Service accounts → Generate new private key. Plak de **hele JSON-inhoud** als één string achter de `=`.

### Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # productie build check
npx tsc --noEmit     # types checken zonder te builden
```

---

## Deployment

Vercel deployt automatisch op iedere push naar `main`.

Bij wijzigingen aan Firestore Security Rules: kopieer `firestore.rules` naar Firebase Console → Firestore → Rules → Publish. (Of via CLI: `firebase deploy --only firestore:rules`.)

---

## Map-structuur

```
src/
├── app/
│   ├── page.tsx                       ← root component, tab routing
│   ├── api/
│   │   ├── admin/create-group/        ← server-only group creation
│   │   └── voice/                     ← spraak-naar-tekst (voor item toevoegen)
│   └── layout.tsx
├── components/
│   ├── PackingList.tsx                ← paklijst per categorie
│   ├── TipsView.tsx                   ← tips & knopen
│   ├── TripsView.tsx                  ← campings + wishlist + bergtrip
│   ├── MountainView.tsx               ← weer, refuges, sunrise voor bergtrips
│   ├── BeheerView.tsx                 ← item beheer
│   ├── LoginScreen.tsx                ← join / create flow
│   ├── SwipeableRow.tsx               ← mobile swipe-delete + desktop hover-edit/delete
│   └── ...
├── hooks/
│   ├── useAuth.ts                     ← session, joinGroup, createGroup (via API)
│   └── useStorage.ts                  ← Firestore state + subscriptions per groupId
└── lib/
    ├── types.ts                       ← alle TypeScript types
    ├── defaultData.ts                 ← ← HIER pas je standaard items/tips aan
    ├── firestore.ts                   ← Firestore client-side (per-groep gescoped)
    ├── firebaseAdmin.ts               ← server-only Admin SDK
    └── firebase.ts                    ← Firebase client init
```

---

## Externe data-bronnen

| Wat | Bron | Endpoint |
|---|---|---|
| Weersvoorspelling | Open-Meteo | `api.open-meteo.com/v1/forecast` |
| Geocoding (plaatsnamen → coördinaten) | Open-Meteo | `geocoding-api.open-meteo.com/v1/search` |
| Berghutten | Refuges.info | `refuges.info/api/bbox` |
| Zonsop-/ondergang | sunrise-sunset.org | `api.sunrise-sunset.org/json` |
| Knoop-animaties | knots3d.com / animatedknots.com | direct linken via `knotIcon` of `linkUrl` |

Allemaal gratis, geen API-keys nodig.
