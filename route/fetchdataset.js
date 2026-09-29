const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const fetchData = (req) => {
  const results = [];
  const csvFilePath = path.join(__dirname, '..', 'data', 'Place-Data.csv');
  const protocol = req ? req.headers['x-forwarded-proto'] || req.protocol : '';
  const host = req ? req.headers['x-forwarded-host'] || req.get('host') : '';
  const baseUrl = protocol && host ? `${protocol}://${host}` : '';

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const formattedData = results.map((item) => {
          const travelUrl = item.travel || `https://www.google.com/search?q=open+trip+${encodeURIComponent(item.place)}`;
          let imageUrl = item.images || '';
          if (imageUrl.startsWith('/') && baseUrl) {
            imageUrl = `${baseUrl}${imageUrl}`;
          }
          return {
            place_id: item.place_id,
            rating: parseFloat(item.rating || 0),
            category: item.category,
            place: item.place,
            city: item.city,
            description: item.description,
            price: item.price,
            phone: item.phone,
            sites: item.sites,
            travel: travelUrl,
            travel1: travelUrl,
            images: imageUrl,
          };
        });
        resolve(formattedData);
      })
      .on('error', reject);
  });
};

const getLastUpdated = () => {
  try {
    const statePath = path.join(__dirname, '..', 'data', 'sync-state.json');
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      return state.last_updated || '';
    }
    return '';
  } catch {
    return '';
  }
};

fetchData.getLastUpdated = getLastUpdated;

module.exports = fetchData;

