function jsonToCSV(jsonData, fileName) {
    // Check if json is empty
    if (Object.keys(jsonData).length === 0) {
        console.log('No data to convert');
        return;
    }

    // Get all headers
    const headers = getHeaders(jsonData[0]);

    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    jsonData.forEach((row) => {
        csvContent += getCSVRow(row, headers) + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'data.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function getHeaders(obj, prefix = '') {
    const headers = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            headers.push(...getHeaders(obj[key], prefix + key + '.'));
        } else {
            headers.push(prefix + key);
        }
    }
    return headers;
}

function getCSVRow(obj, headers, prefix = '') {
    const row = [];
    headers.forEach((header) => {
        const key = header.replace(prefix, '');
        if (key in obj) {
            row.push(obj[key]);
        } else {
            row.push('');
        }
    });
    return row.join(',');
}