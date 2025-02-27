// Infinite scroll with debounce

let currentPage = 1;
const itemsPerPage = 10;
let loading = false;
let hasNextPage = true;

// Debounce function
function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

// Fetch more items
async function fetchMoreItems() {
  if (loading || !hasNextPage) return;
  loading = true;
  try {
    const response = await fetch(`https://api.example.com/items? page=${currentPage}&per_page=${itemsPerPage}`);
    const data = await response.json();
    appendItems(data);
    hasNextPage = data.length === itemsPerPage;
    currentPage++;
  } catch (error) {
    console.error('Error fetching items:', error);
  } finally {
    loading = false;
  }
}

// Append items to DOM
function appendItems(items) {
  const container = document.getElementById('content');
  items.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.name;
    container.appendChild(div);
  });
}

// Handle scroll event
const handleScroll = debounce(() => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
  if (isNearBottom) {
    fetchMoreItems();
  }
}, 200);

// Add event listener
window.addEventListener('scroll', handleScroll);

// Initial load
fetchMoreItems();
// Example API endpoint
app.get('/items', (req, res) => {
  const page = req.query.page;
  const perPage = req.query.per_page;
  // Simulate data
  const items = Array.from({ length: perPage }, (_, i) => ({
    id: (page - 1) * perPage + i + 1,
    name: `Item ${((page - 1) * perPage) + i + 1}`
  }));
  res.json(items);
});