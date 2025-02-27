// Deep merge utility function

function deepMerge(target, source) {
  // Create a new object to avoid mutating the target
  const merged = Array.isArray(target) ? [...target] : { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (key in merged) {
        if (typeof source[key] === 'object' && source[key] !== null) {
          merged[key] = deepMerge(merged[key], source[key]);
        } else if (Array.isArray(merged[key]) && Array.isArray(source[key])) {
          merged[key] = [...merged[key], ...source[key]];
        } else {
          merged[key] = source[key];
        }
      } else {
        merged[key] = source[key];
      }
    }
  }

  return merged;
}

// Example usage:
const target = {
  name: 'Alice',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'New York'
  },
  interests: ['reading', 'music']
};

const source = {
  name: 'Bob',
  age: 35,
  address: {
    street: '456 Oak Ave',
    country: 'Canada'
  },
  interests: ['sports', 'cooking']
};

const merged = deepMerge(target, source);
console.log(merged);