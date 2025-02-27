function jsonToCSV(json) {
    // Check if the input is an array
    if (!Array.isArray(json)) {
        json = [json];
    }

    // Helper function to collect all field names from nested objects
    function collectFieldNames(obj, fieldNames) {
        if (typeof obj !== 'object' || obj === null) {
            return;
        }

        Object.keys(obj).forEach(key => {
            fieldNames.push(key);
            // Recursively collect field names from nested objects
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                collectFieldNames(obj[key], fieldNames);
            }
        });
    }

    // Collect all field names from the JSON data
    const fieldNames = [];
    collectFieldNames(json[0], fieldNames);

    // Create CSV header
    const csvHeader = fieldNames.join(',');

    // Create CSV rows
    const csvRows = json.map(obj => {
        const row = fieldNames.map(fieldName => {
            // Check if the field exists in the current object
            if (obj[fieldName] === undefined) {
                return '';
            }
            // If the field's value is an object, stringify it
            return typeof obj[fieldName] === 'object' ? JSON.stringify(obj[fieldName]) : obj[fieldName];
        }).join(',');

        return row;
    });

    // Combine header and rows into the final CSV string
    const csvContent = [csvHeader, ...csvRows].join('\n');

    return csvContent;
}

// Example usage:
const json = {
    name: {
        first: "John",
        last: "Doe"
    },
    age: 30
};

console.log(jsonToCSV(json));