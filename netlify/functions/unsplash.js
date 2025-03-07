const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET'
  };

  try {
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      throw new Error('Missing Unsplash API key');
    }

    const response = await fetch(
      `https://api.unsplash.com/photos/random?orientation=landscape&query=nature`,
      {
        headers: {
          'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Unsplash API');
    }

    const data = await response.json();

    // Return only necessary data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        urls: {
          regular: data.urls.regular
        },
        alt_description: data.alt_description
      })
    };
  } catch (error) {
    console.error('Unsplash API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch image'
      })
    };
  }
};
