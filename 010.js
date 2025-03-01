// Debounce Function
function debounce(fn, wait = 500) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
        }, wait);
    };
}

// Throttle Function
function throttle(fn, delay = 500) {
    let lastCallTime;
    return function(...args) {
        const now = Date.now();
        if (!lastCallTime || now - lastCallTime >= delay) {
            fn.apply(this, args);
            lastCallTime = now;
        }
    };
}

// Example usage with window resize event
const handleResize = () => {
    console.log('Window resized to:', window.innerWidth, 'x', window.innerHeight);
};

// Apply debounce to handleResize
const debouncedHandleResize = debounce(handleResize);

window.addEventListener('resize', debouncedHandleResize);

// Apply throttle to handleResize
const throttledHandleResize = throttle(handleResize);

window.addEventListener('resize', throttledHandleResize);