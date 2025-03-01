// Function to fetch product data
async function fetchProduct(id) {
    try {
        const response = await fetch(`https://api.example.com/products/${id}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

// Function to initialize the product page
async function initProductPage() {
    const productId = window.location.pathname.split('/').pop();
    const product = await fetchProduct(productId);

    if (!product) {
        document.getElementById('productContainer').innerHTML = 'Product not found';
        return;
    }

    // Display product details
    displayProductDetails(product);

    // Initialize image gallery
    initImageGallery(product.images);

    // Fetch and display reviews
    const reviews = await fetchReviews(product.id);
    displayReviews(reviews);

    // Cache product data in IndexedDB
    cacheProductData(product);
}

// Function to display product details
function displayProductDetails(product) {
    const productContainer = document.getElementById('productContainer');
    productContainer.innerHTML = `
        <h1>${product.name}</h1>
        <p>${product.description}</p>
        <p>Price: $${product.price}</p>
    `;
}

// Function to initialize image gallery
function initImageGallery(images) {
    const gallery = document.getElementById('imageGallery');
    images.forEach(image => {
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.description;
        gallery.appendChild(img);
    });
}

// Function to fetch reviews
async function fetchReviews(productId) {
    try {
        const response = await fetch(`https://api.example.com/products/${productId}/reviews`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

// Function to display reviews
function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviewsContainer');
    reviewsContainer.innerHTML = reviews.map(review => `
        <div class="review">
            <h3>${review.author}</h3>
            <p>Rating: ${review.rating}/5</p>
            <p>${review.text}</p>
        </div>
    `).join('');
}

// Function to cache product data in IndexedDB
function cacheProductData(product) {
    if (!window.indexedDB) {
        console.log('IndexedDB is not supported');
        return;
    }

    const request = window.indexedDB.open('productsDB', 1);
    request.onupgradeneeded = function(e) {
        const db = e.target.result;
        db.createObjectStore('products', { keyPath: 'id' });
    };

    request.onsuccess = function(e) {
        const db = e.target.result;
        const transaction = db.transaction('products', 'readwrite');
        const store = transaction.objectStore('products');
        store.put(product);
        transaction.oncomplete = function() {
            db.close();
        };
    };
}

// Function to filter reviews by rating
function filterReviewsByRating(rating) {
    fetchReviews().then(reviews => {
        const filteredReviews = reviews.filter(review => review.rating >= rating);
        displayReviews(filteredReviews);
    });
}

// Event listener for rating filter
document.getElementById('ratingFilter').addEventListener('change', function(e) {
    filterReviewsByRating(e.target.value);
});

// Initialize the product page
window.onload = initProductPage;