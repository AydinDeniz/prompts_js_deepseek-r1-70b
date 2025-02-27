// Import TensorFlow.js
import * as tf from '@tensorflow/tfjs';

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  redirectUri: 'YOUR_REDIRECT_URI'
});

// Load user listening history
async function loadUserHistory() {
  try {
    const user = await spotifyApi.getMe();
    const tracks = await spotifyApi.getUserSavedTracks();
    return tracks.items.map(item => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists[0].name,
      features: await getAudioFeatures(item.track.id)
    }));
  } catch (error) {
    console.error('Error loading user history:', error);
  }
}

// Get audio features for a track
async function getAudioFeatures(trackId) {
  try {
    const features = await spotifyApi.getAudioFeaturesForTrack(trackId);
    return [
      features.danceability,
      features.energy,
      features.key,
      features.loudness,
      features.mode,
      features.speechiness,
      features.acousticness,
      features.instrumentalness,
      features.liveness,
      features.valence,
      features.tempo
    ];
  } catch (error) {
    console.error('Error getting audio features:', error);
  }
}

// TensorFlow.js model for recommendations
const model = tf.sequential({
  layers: [
    tf.layers.dense({ units: 10, activation: 'relu', inputShape: [11] }),
    tf.layers.dense({ units: 10, activation: 'relu' }),
    tf.layers.dense({ units: 11, activation: 'linear' })
  ]
});

// Compile model
model.compile({
  optimizer: tf.train.adam(),
  loss: 'meanSquaredError',
  metrics: ['accuracy']
});

// Train model with user history
async function trainModel(userHistory) {
  try {
    const inputs = userHistory.map(item => item.features);
    const outputs = userHistory.map(item => item.features);
    const inputTensor = tf.tensor2d(inputs, [inputs.length, 11]);
    const outputTensor = tf.tensor2d(outputs, [outputs.length, 11]);
    
    await model.fit(inputTensor, outputTensor, {
      epochs: 100,
      batchSize: 32,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}`);
        }
      }
    });
  } catch (error) {
    console.error('Error training model:', error);
  }
}

// Generate recommendations
async function generateRecommendations() {
  try {
    const userHistory = await loadUserHistory();
    await trainModel(userHistory);
    
    const recommendations = await spotifyApi.getRecommendations({
      limit: 10,
      seeds: userHistory.map(item => item.id)
    });
    
    return recommendations.tracks;
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
}

// Create playlist
async function createPlaylist() {
  try {
    const recommendations = await generateRecommendations();
    const playlist = await spotifyApi.createPlaylist('AI Recommendations', {
      description: 'Personalized playlist based on your listening history'
    });
    
    await spotifyApi.addTracksToPlaylist(playlist.id, recommendations.map(track => track.id));
    return playlist;
  } catch (error) {
    console.error('Error creating playlist:', error);
  }
}