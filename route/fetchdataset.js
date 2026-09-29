const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const fetchData = () => {
  const results = [];
  const csvFilePath = path.join(__dirname, '..', 'data', 'Place-Data.csv');

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const formattedData = results.map((item) => {
          const travelUrl = item.travel || `https://www.google.com/search?q=open+trip+${encodeURIComponent(item.place)}`;
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
            images: item.images || '',
          };
        });
        resolve(formattedData);
      })
      .on('error', reject);
  });
};

module.exports = fetchData;

