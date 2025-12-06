const { onRequest } = require('firebase-functions/v2/https');
const axios = require('axios');

exports.locationSearch = onRequest({ cors: true }, async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        // Use the same API key as other Google services or a specific Maps key
        const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            console.error('Google Maps API key not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        console.log(`🔍 Searching for location: ${query}`);

        // Use Google Places Text Search API (New) or Text Search (Old)
        // Using the newer Text Search (Basic)
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/textsearch/json`,
            {
                params: {
                    query: query,
                    key: apiKey,
                    fields: 'formatted_address,geometry,place_id,name'
                }
            }
        );

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            console.error('Google Maps API error:', response.data);
            return res.status(500).json({ error: 'Failed to search location', details: response.data.status });
        }

        const results = response.data.results.map(place => ({
            formatted_address: place.formatted_address,
            place_id: place.place_id,
            name: place.name,
            location: place.geometry?.location,
            types: place.types
        }));

        console.log(`✅ Found ${results.length} locations`);

        return res.json({
            success: true,
            locations: results
        });

    } catch (error) {
        console.error('Error in location search:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});
