// Import required libraries
import * as tf from '@tensorflow/tfjs';

// Mock user interaction data
const userData = [
  { userId: 1, productId: 10, rating: 4 },
  { userId: 1, productId: 20, rating: 3 },
  { userId: 2, productId: 10, rating: 5 },
  { userId: 2, productId: 30, rating: 4 },
  { userId: 3, productId: 20, rating: 2 },
  { userId: 3, productId: 40, rating: 3 }
];

// Create user-product matrix
const userProductMatrix = tf.tensor2d(
  [
    [4, 3, 0, 0],
    [5, 0, 4, 0],
    [0, 2, 0, 3]
  ],
  [3, 4]
);

// Compute user similarities
const userSimilarities = tf.cosineSimilarity(userProductMatrix, axis=1);

// Generate recommendations
async function generateRecommendations(userId) {
  try {
    const similarities = await userSimilarities.dataSync();
    const recommendations = [];
    
    for (let i = 0; i < similarities[userId].length; i++) {
      if (similarities[userId][i] > 0.5) {
        const similarUser = i;
        const similarUserProducts = await getUserProducts(similarUser);
        recommendations.push(...similarUserProducts);
      }
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
}

// Get user products
async function getUserProducts(userId) {
  try {
    const products = await tf.tidy(() => {
      const indices = tf.where(tf.equal(userData.map(d => d.userId), userId));
      const productIds = userData[indices.dataSync()].map(d => d.productId);
      return productIds;
    });
    return products.dataSync();
  } catch (error) {
    console.error('Error getting user products:', error);
  }
}
// Import required libraries
import * as tf from '@tensorflow/tfjs';

// Mock product data
const products = [
  { id: 10, name: 'Product A', category: 'Electronics' },
  { id: 20, name: 'Product B', category: 'Electronics' },
  { id: 30, name: 'Product C', category: 'Books' },
  { id: 40, name: 'Product D', category: 'Books' }
];

// Create product embeddings
const productEmbeddings = tf.random.uniform([products.length, 10]);

// Compute product similarities
const productSimilarities = tf.cosineSimilarity(productEmbeddings, axis=1);

// Generate recommendations based on product similarities
async function recommendProducts(productId) {
  try {
    const similarities = await productSimilarities.dataSync();
    const recommendations = [];
    
    for (let i = 0; i < similarities[productId].length; i++) {
      if (similarities[productId][i] > 0.5) {
        const similarProduct = products[i];
        recommendations.push(similarProduct);
      }
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error recommending products:', error);
  }
}
// Workflow to generate recommendations
async function recommendProductsToUser(userId) {
  try {
    const userBasedRecs = await generateRecommendations(userId);
    const productBasedRecs = await recommendProducts(userId);
    const combinedRecs = [...userBasedRecs, ...productBasedRecs];
    
    // Remove duplicates and display
    const uniqueRecs = Array.from(new Set(combinedRecs));
    displayRecommendations(uniqueRecs);
  } catch (error) {
    console.error('Error in recommendation workflow:', error);
  }
}

// Display recommendations
function displayRecommendations(recommendations) {
  const recList = document.getElementById('recommendations');
  recList.innerHTML = '';
  
  recommendations.forEach(item => {
    const li = document.createElement('li');
    li.className = 'product-item';
    li.textContent = item.name;
    recList.appendChild(li);
  });
}
// Combine collaborative filtering and content-based filtering
async function hybridRecommend(userId) {
  try {
    const cfRecs = await generateRecommendations(userId);
    const cbRecs = await recommendProducts(userId);
    const hybridRecs = [...cfRecs, ...cbRecs];
    
    // Remove duplicates
    const uniqueRecs = Array.from(new Set(hybridRecs));
    return uniqueRecs;
  } catch (error) {
    console.error('Error in hybrid recommendation:', error);
  }
}