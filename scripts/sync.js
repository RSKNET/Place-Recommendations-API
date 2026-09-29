const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const csv = require('csv-parser');

const envLocalPath = path.join(__dirname, '..', '.env.local');
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: fs.existsSync(envLocalPath) ? envLocalPath : envPath });

const CSV_FILE_PATH = path.join(__dirname, '..', 'data', 'Place-Data.csv');
const STATE_FILE_PATH = path.join(__dirname, '..', 'data', 'sync-state.json');

const readCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
};

const escapeCsv = (val) => {
  if (val === undefined || val === null) {
    return '';
  }
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

const writeCsv = (filePath, rows) => {
  const header = 'place_id,city,place,category,rating,description,phone,sites,price,travel,images';
  const lines = [header];
  for (const r of rows) {
    lines.push([
      escapeCsv(r.place_id),
      escapeCsv(r.city),
      escapeCsv(r.place),
      escapeCsv(r.category),
      escapeCsv(r.rating),
      escapeCsv(r.description),
      escapeCsv(r.phone),
      escapeCsv(r.sites),
      escapeCsv(r.price),
      escapeCsv(r.travel),
      escapeCsv(r.images),
    ].join(','));
  }
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
};

const readState = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { last_place_id: '' };
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return { last_place_id: '' };
  }
};

const writeState = (filePath, state) => {
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
};

const fetchPhotoUri = async (apiKey, photoName) => {
  try {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=800&key=${apiKey}&skipHttpRedirect=true`;
    const response = await fetch(url);
    if (!response.ok) {
      return '';
    }
    const data = await response.json();
    return data.photoUri || '';
  } catch {
    return '';
  }
};

const fetchPlaceDetails = async (apiKey, placeName, cityName) => {
  try {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.nationalPhoneNumber,places.websiteUri,places.priceLevel,places.photos',
      },
      body: JSON.stringify({
        textQuery: `${placeName}, ${cityName}`,
        languageCode: 'id',
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (!result.places || result.places.length === 0) {
      return null;
    }

    const place = result.places[0];
    let photoUri = '';
    if (place.photos && place.photos.length > 0) {
      photoUri = await fetchPhotoUri(apiKey, place.photos[0].name);
    }

    return {
      rating: place.rating ? String(place.rating) : '',
      phone: place.nationalPhoneNumber || '',
      sites: place.websiteUri || '',
      price: place.priceLevel || '',
      images: photoUri,
    };
  } catch {
    return null;
  }
};

const sync = async (batchLimit = 100) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    process.exit(1);
  }

  const rows = await readCsv(CSV_FILE_PATH);
  if (rows.length === 0) {
    return;
  }

  const state = readState(STATE_FILE_PATH);
  let startIndex = 0;

  if (state.last_place_id) {
    const foundIndex = rows.findIndex((r) => r.place_id === state.last_place_id);
    if (foundIndex !== -1 && foundIndex + 1 < rows.length) {
      startIndex = foundIndex + 1;
    }
  }

  const countToProcess = Math.min(batchLimit, rows.length);
  let lastProcessedId = state.last_place_id;

  for (let i = 0; i < countToProcess; i++) {
    const currentIndex = (startIndex + i) % rows.length;
    const row = rows[currentIndex];

    const details = await fetchPlaceDetails(apiKey, row.place, row.city);
    if (details) {
      if (details.rating) row.rating = details.rating;
      if (details.phone) row.phone = details.phone;
      if (details.sites) row.sites = details.sites;
      if (details.price) row.price = details.price;
      if (details.images) row.images = details.images;
    }

    lastProcessedId = row.place_id;

    if (currentIndex === rows.length - 1) {
      lastProcessedId = '';
      break;
    }
  }

  writeCsv(CSV_FILE_PATH, rows);
  writeState(STATE_FILE_PATH, { last_place_id: lastProcessedId });
};

const batchArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = batchArg ? parseInt(batchArg.split('=')[1], 10) : 700;

sync(limit).catch(() => process.exit(1));
