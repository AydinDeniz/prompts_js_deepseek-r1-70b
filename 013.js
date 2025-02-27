// IndexedDB database setup
const db = indexedDB.open('ecommerceDatabase', 2);

// Product interface
interface Product {
    id: number;
    title: string;
    description: string;
    price: number;
    quantity: number;
    images: string[];
    reviews: Review[];
}

// Review interface
interface Review {
    id: number;
    user: string;
    rating: number;
    comment: string;
    date: string;
}

class ProductManager {
    static instance: ProductManager;

    constructor() {
        this.initializeDB();
        this.loadProduct();
    }

    static getInstance(): ProductManager {
        if (!ProductManager.instance) {
            ProductManager.instance = new ProductManager();
        }
        return ProductManager.instance;
    }

    initializeDB() {
        const db = indexedDB.open('ecommerceDatabase', 2);

        db.on('success', function(event) {
            if (event.target.result) {
                // Existing database
                ProductManager.getInstance().loadProduct();
            }
        });

        db.on('error', function(event) {
            console.error('Database error:', event);
        });
    }

    async loadProduct() {
        try {
            const response = await fetch('https://your-api-endpoint/product/123');
            const product = await response.json();

            const tx = db.transaction('write', ['products'], function(store, idx) {
                store.put([ [product.id, product] ]);
            });

            ProductManager.getInstance().product = product;
            this.updateProductDisplay();
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Failed to load product');
        }
    }

    async loadReviews() {
        try {
            const response = await fetch('https://your-api-endpoint/reviews/123');
            const reviews = await response.json();

            const tx = db.transaction('write', ['reviews'], function(store, idx) {
                store.put([ [Math.random(), ...reviews] ]);
            });

            this.reviews = reviews;
            this.updateReviewDisplay();
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.showError('Failed to load reviews');
        }
    }

    updateProductDisplay() {
        const container = document.getElementById('product-container');
        container.innerHTML = `
            <div class="product-images">
                ${this.product.images.map(img =>
                    `<img src="${img}" alt="${this.product.title}" class="product-image">`
                ).join('')}
            </div>

            <div class="product-details">
                <h1>${this.product.title}</h1>
                <p>${this.product.description}</p>
                <div class="product-price">${new Intl.NumberFormat('en-US', { value: this.product.price }).format()}</div>
                <div class="product-quantity">
                    <span>Quantity:</span>
                    <input type="number" id="quantity" value="1" min="1" max="${this.product.quantity}">
                </div>
            </div>
        `;
    }

    updateReviewDisplay() {
        const reviewContainer = document.getElementById('reviews-container');
        reviewContainer.innerHTML = `
            <div class="review-filter">
                <h3>Filter Reviews:</h3>
                ${Array.from({ length: 5 }).map((_, i) =>
                    `<button onclick="filterReviews(${i+1})" class="${i+1 === this.currentRating ? 'selected' : ''}">
                        ★ ${i+1}
                    </button>`
                ).join('')}
            </div>

            <div id="reviews-list"></div>
        `;

        this.displayReviews();
    }

    displayReviews() {
        const reviewsContainer = document.getElementById('reviews-list');
        const filteredReviews = this.reviews.filter(review =>
            review.rating === (document.querySelector('button.selected').textContent.match(/\d/)[0] || 5)
        );

        reviewsContainer.innerHTML = filteredReviews.map(review => `
            <div class="review-item">
                <div class="review-info">
                    <p>${review.user}</p>
                    <p>${review.rating} ★</p>
                </div>
                <p>${review.comment}</p>
                <p class="review-date">${review.date}</p>
            </div>
        `).join('');
    }

    filterReviews(rating) {
        document.querySelectorAll('button').forEach(button =>
            button.classList.remove('selected')
        );
        document.querySelector(`button.${rating}`).classList.add('selected');

        this.reviews = this.reviews.filter(review => review.rating === rating);
        this.displayReviews();
    }

    showError(message) {
        alert(message);
    }
}

// Initialize product manager
const productManager = ProductManager.getInstance();
productManager.loadProduct();
productManager.loadReviews();

// Add back button functionality
document.getElementById('backButton').addEventListener('click', function() {
    window.history.back();
});