# DatasetFinder

Search for machine learning datasets across Hugging Face, the UCI Machine Learning Repository, Kaggle and Google Dataset Search from one box.

Live: [dazzling-gumption-23f00b.netlify.app](https://dazzling-gumption-23f00b.netlify.app)

## Three tools

**Search.** Type a topic and get one table of results from every repository you tick. Sort by best match, downloads or last update, and filter to a single source. The query lives in the URL, so you can share or bookmark a search.

**Recommend.** Describe your project in a sentence. The recommender matches it against 17 task patterns (fraud, sentiment, speech, forecasting and so on), pulls out keywords, searches Hugging Face and UCI for each, and ranks the combined results by keyword and tag overlap plus popularity. The page shows how it read your description, so you can rephrase if it guessed wrong.

**Check quality.** Paste a Hugging Face dataset ID or link. The checker reads the dataset card and the Hugging Face datasets server statistics, then reports rows, columns, splits, missing values per column, label balance, licence and a score out of 100 with the issues that cost points. Other URLs get a basic check of format and size.

## How it's built

```
src/
  pages/            Search, Recommender, QualityChecker
  components/       Header, Catalogue (results table), loading and error states
  lib/              Number, size and date formatting; source labels and colours
  utils/api.js      Calls to the Netlify functions
  styles.css        All styling, as plain CSS with custom properties
netlify/functions/
  search.js         Fans out to Hugging Face, UCI and Kaggle APIs
  recommend.js      Pattern matching, keyword extraction, ranking
  quality.js        Hugging Face card and statistics, quality score
tests/
  format.test.js    Formatting helpers (node --test)
```

React 18, React Router and Vite on the front end. Netlify Functions do the API calls server side, which avoids CORS problems and keeps the optional Kaggle key off the client.

## Run it locally

```bash
npm install
npx netlify dev        # app and functions together on http://localhost:8888
```

`npm run dev` starts only the Vite server and proxies function calls to port 8888, so run `netlify dev` alongside it if you use that.

```bash
npm test               # unit tests
npm run lint
npm run build
```

### Kaggle

Kaggle results need API credentials. Set these in Netlify's environment settings, or in a local `.env` for `netlify dev`:

```
KAGGLE_USERNAME=your_username
KAGGLE_KEY=your_key
```

Without them, the Kaggle option adds a link that runs the same search on kaggle.com.

## Design notes

The results read like a library card catalogue rather than a grid of tiles. Each row gives the dataset's name and ID on the left and the numbers you compare (downloads, size, last update) in aligned columns on the right. A coloured edge on every row shows which repository it came from: amber for Hugging Face, blue for Kaggle, green for UCI, red for Google.

Instrument Sans sets the interface. JetBrains Mono appears only on dataset identifiers like `stanfordnlp/imdb`, since those get copied into code. Both fonts are bundled through Fontsource, so nothing loads from a third party.
