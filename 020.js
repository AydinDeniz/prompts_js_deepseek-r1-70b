// news-aggregator.js
const newsContainer = document.getElementById('news-container');
const preferencesForm = document.getElementById('preferences-form');
const notificationBell = document.getElementById('notification-bell');

// Initialize NewsAPI
const newsapi = new NewsAPI('your-api-key');

// Load user preferences
let userPrefs = JSON.parse(localStorage.getItem('userPrefs')) || {
    topics: [],
    sources: [],
    breakingNews: true
};

// Load saved preferences
function loadPreferences() {
    const topicChecks = document.querySelectorAll('[name="topic"]');
    topicChecks.forEach(check => {
        if (userPrefs.topics.includes(check.value)) {
            check.checked = true;
        }
    });

    const sourceChecks = document.querySelectorAll('[name="source"]');
    sourceChecks.forEach(check => {
        if (userPrefs.sources.includes(check.value)) {
            check.checked = true;
        }
    });

    document.getElementById('breaking-news').checked = userPrefs.breakingNews;
}

// Save user preferences
function savePreferences() {
    userPrefs.topics = Array.from(document.querySelectorAll('[name="topic"]:checked')).map(check => check.value);
    userPrefs.sources = Array.from(document.querySelectorAll('[name="source"]:checked')).map(check => check.value);
    userPrefs.breakingNews = document.getElementById('breaking-news').checked;
    localStorage.setItem('userPrefs', JSON.stringify(userPrefs));
}

// Fetch and display news
async function fetchNews() {
    try {
        const response = await newsapi.v2.everything({
            q: userPrefs.topics.join(' OR '),
            sources: userPrefs.sources.join(','),
            sortBy: 'publishedAt',
            apiKey: 'your-api-key'
        });

        displayNews(response.articles);
    } catch (error) {
        console.error('Error fetching news:', error);
    }
}

// Display news articles
function displayNews(articles) {
    newsContainer.innerHTML = articles.map(article => `
        <div class="article">
            <h2><a href="${article.url}" target="_blank">${article.title}</a></h2>
            <p>${article.description}</p>
            <p>Source: ${article.source.name}</p>
            <p>Published: ${new Date(article.publishedAt).toLocaleString()}</p>
        </div>
    `).join('');
}

// Breaking news notifications
async function checkBreakingNews() {
    try {
        const response = await newsapi.v2.everything({
            q: userPrefs.topics.join(' OR '),
            sources: userPrefs.sources.join(','),
            sortBy: 'publishedAt',
            apiKey: 'your-api-key',
            pageSize: 1
        });

        if (response.articles.length > 0) {
            const notification = new Notification('Breaking News', {
                body: response.articles[0].title,
                icon: response.articles[0].urlToImage
            });
            notificationBell.innerHTML = '●';
        }
    } catch (error) {
        console.error('Error checking breaking news:', error);
    }
}

// Event listeners
preferencesForm.addEventListener('change', savePreferences);
document.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    fetchNews();
    setInterval(fetchNews, 300000); // Refresh every 5 minutes
    setInterval(checkBreakingNews, 60000); // Check for breaking news every minute
});

// Notification system
if ('Notification' in window) {
    Notification.requestPermission(status => {
        if (status === 'granted') {
            console.log('Notification permission granted');
        } else {
            console.log('Notification permission denied');
        }
    });
}

// Initialize news feed
fetchNews();