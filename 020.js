// Save user preferences in localStorage
const preferences = {
    newsCategories: ['Technology', 'Politics', 'Business', 'Science', 'Sports', 'Entertainment'],
    lastFetch: new Date().toISOString()
};

// Initialize preferences if not set
if (!localStorage.getItem('newsPreferences')) {
    localStorage.setItem('newsPreferences', JSON.stringify(preferences));
}

// NewsAPI key (replace with your actual key)
const newsApiKey = 'YOUR_NEWS_API_KEY';

// Fetch news based on preferences
async function fetchNews() {
    try {
        const categories = preferences.newsCategories;
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=100&sources=${categories.join(',')}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': newsApiKey
            }
        });

        const data = await response.json();
        displayNewsResults(data.articles);
    } catch (error) {
        showError('Failed to fetch news articles');
    }
}

// Display news results
function displayNewsResults(articles) {
    const resultsContainer = document.getElementById('newsResults');
    resultsContainer.innerHTML = '';

    articles.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.className = 'news-item';
        articleElement.innerHTML = `
            <div class="news-image">
                <img src="${article.urlToImage || 'https://placehold.co/400x300'}" alt="${article.title}">
            </div>
            <div class="news-content">
                <h3>${article.title}</h3>
                <p>${article.description}</p>
                <div class="news-source">
                    <span>${article.source.name}</span>
                    <span class="news-date">${article.publishedAt}</span>
                </div>
            </div>
        `;
        resultsContainer.appendChild(articleElement);
    });
}

// Handle category selection
document.getElementById('categorySelect').addEventListener('change', function() {
    const categories = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(
        el => el.value
    );

    preferences.newsCategories = categories;
    localStorage.setItem('newsPreferences', JSON.stringify(preferences));
    fetchNews();
});

// Handle search input
document.getElementById('searchInput').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();

    // Filter news based on search term
    const filteredNews = preferences.newsCategories
        .map(category =>
            document.getElementById(category).files
        )
        .flat()
        .filter(article => article.title.toLowerCase().includes(searchTerm));

    displayNewsResults(filteredNews);
});

// Show error messages
function showError(message) {
    alert(message);
}

// Show success messages
function showSuccess(message) {
    alert(message);
}

// Initialize news aggregator
document.addEventListener('DOMContentLoaded', function() {
    // Display news based on preferences
    fetchNews();

    // Check for breaking news periodically
    const newsInterval = setInterval(async function() {
        try {
            const latestNews = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=10&sources=${preferences.newsCategories.join(',')}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': newsApiKey
                }
            });

            const data = await latestNews.json();
            const hasBreakingNews = data.articles.some(article =>
                article.source.name === 'Breaking News' ||
                article.title.toLowerCase().includes('breaking')
            );

            if (hasBreakingNews) {
                showSuccess('Breaking news detected!');
            }
        } catch (error) {
            console.error('News check failed:', error);
        }
    }, 3600000); // Check every hour

    // Destroy interval on unload
    window.addEventListener('unload', () => clearInterval(newsInterval));
});