function debounce(func, wait) {
    let timeout;

    function debounced(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(undefined, args);
        }, wait);
    }

    return debounced;
}

function throttle(func, wait) {
    let lastExecTime = 0;
    let timeout;

    function throttled(...args) {
        const currentTime = Date.now();

        if (currentTime - lastExecTime < wait) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(undefined, args);
                lastExecTime = Date.now();
            }, wait);
        } else {
            func.apply(undefined, args);
            lastExecTime = Date.now();
        }
    }

    return throttled;
}

// Example usage for debounce:
const debounceFunc = debounce(() => {
    console.log(' Debounced function called');
}, 1000);

// Example usage for throttle:
const throttleFunc = throttle(() => {
    console.log(' Throttled function called');
}, 500);

window.addEventListener('resize', debounce(() => {
    console.log('Window resized');
}, 500));

window.addEventListener('scroll', throttle(() => {
    console.log('Window scrolled');
}, 200));