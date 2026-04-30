# HNG Backend - Stage 1

You send a name, the API figures out the person's likely gender, age, and nationality using three external APIs, saves the result, and lets you query the data in a bunch of useful ways.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/profiles | Create a profile (hits Genderize, Agify, and Nationalize) |
| GET | /api/profiles | List profiles with filters, sorting, and pagination |
| GET | /api/profiles/search | Search profiles using plain English |
| GET | /api/profiles/:id | Get one profile by its UUID |
| DELETE | /api/profiles/:id | Delete a profile by its UUID |

---

## Filtering profiles (GET /api/profiles)

You can mix and match any of these query parameters. Every condition you add narrows the results further.

| Param | Description |
|-------|-------------|
| gender | "male" or "female" |
| age_group | "child", "teenager", "adult", or "senior" |
| country_id | Two-letter ISO country code, e.g. NG |
| min_age | Only include profiles where age is at least this value |
| max_age | Only include profiles where age is at most this value |
| min_gender_probability | Only include profiles where gender_probability is at least this value |
| min_country_probability | Only include profiles where country_probability is at least this value |
| sort_by | Field to sort by: age, created_at, or gender_probability |
| order | Sort direction: asc or desc (defaults to desc) |
| page | Page number, starting from 1 (defaults to 1) |
| limit | How many results per page (defaults to 10, max 50) |

Example:

```
GET /api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10
```

---

## Natural language search (GET /api/profiles/search)

Pass a plain English query using the `q` parameter. The same `page` and `limit` params work here too.

```
GET /api/profiles/search?q=young males from nigeria
GET /api/profiles/search?q=adult females above 30
GET /api/profiles/search?q=teenagers from south africa
```

---

## How the natural language parser works

No AI involved. It is entirely rule-based.

**Step 1 - Split into words**

The query is lowercased and split on whitespace into individual tokens.

**Step 2 - Keyword lookup**

Each word is checked against a predefined map. If it matches, the corresponding filter values get merged in. The map includes age group words, gender words, and every country name in the world (mapped to its ISO country code).

**Step 3 - Multi-word patterns**

After the word-by-word pass, the parser runs a few regex checks to catch things that span multiple words:

- "above 30", "over 30", "older than 30" set min_age to 30
- "below 25", "under 25", "younger than 25" set max_age to 25
- "aged 22" or "age 22" sets both min_age and max_age to 22 (exact match)
- "from nigeria" or "from south africa" tries matching 3, 2, then 1 word after "from" against country names, so multi-word countries work correctly

**Step 4 - Result**

If at least one thing matched, the collected filters get sent to the database. If nothing matched, the API returns a 400 with "Unable to interpret query".

---

## Supported keywords

| What you type | What it filters to |
|---------------|-------------------|
| young | min_age=16, max_age=24 |
| teenager, teen, teens, teenagers | age_group=teenager, min_age=13, max_age=19 |
| adult, adults | age_group=adult, min_age=20 |
| child, children, kids | age_group=child, min_age=1, max_age=12 |
| senior, seniors, elderly | age_group=senior, min_age=60 |
| male, males, men, man, boy, boys | gender=male |
| female, females, women, woman, girl, girls | gender=female |
| nigeria, kenya, angola, (any country name) | country_id set to that country's ISO code |
| above 30, over 30, older than 30 | min_age=30 |
| below 25, under 25, younger than 25 | max_age=25 |
| aged 22, age 22 | min_age=22 and max_age=22 |
| from nigeria, from south africa | country_id=NG, country_id=ZA |

## How the spec examples map

| Query | What gets parsed |
|-------|-----------------|
| young males | gender=male, min_age=16, max_age=24 |
| females above 30 | gender=female, min_age=30 |
| people from angola | country_id=AO |
| adult males from kenya | gender=male, age_group=adult, min_age=20, country_id=KE |
| male and female teenagers above 17 | age_group=teenager, min_age=17 |

---

## Limitations

**"young" is not stored as an age group.** It maps to min_age=16, max_age=24 for filtering only. The database only has child, teenager, adult, and senior as stored age groups.

**Multi-gender queries pick the last one.** If you write "male and female", both words match, and whichever comes last wins. The parser does not generate an OR query across genders.

**Multi-word countries need "from".** Writing "south africa" without "from" will not match because the parser checks one word at a time. Write "from south africa" instead.

**Age keywords and numeric modifiers can conflict.** "teenager above 20" would first set max_age=19 from the "teenager" keyword, then overwrite min_age to 20 from "above 20". You would get zero results because min_age=20 and max_age=19 cannot both be true. Be specific when mixing these.

**Some country names overlap with other keywords.** For example, "man" matches as a gender term (male) before it can match the Isle of Man as a country. Gender and age keywords take priority in the map.

**Country codes in the filter param must be uppercase.** Passing country_id=ng instead of country_id=NG will return no results. The natural language parser always produces uppercase codes.

**No "between X and Y" syntax.** Write "above 20" and "below 30" or just use min_age=20&max_age=30 on the list endpoint.

**No negation or OR logic.** Queries like "not male" or "excluding nigeria" are not supported. Every parsed filter is AND-combined.

---

## Seeding the database

```bash
npm run seed
```

This loads 2026 profiles from seed_profiles.json. Running it more than once is fine - duplicate records are skipped automatically.

---

## Running locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Environment variables

| Variable | Required | Default |
|----------|----------|---------|
| MONGO_URL | Yes | (none) |
| GENDERIZE_API_URL | No | https://api.genderize.io |
| AGIFY_API_URL | No | https://api.agify.io |
| NATIONALIZE_API_URL | No | https://api.nationalize.io |
| PORT | No | 3000 |
