/**
 * Convert an array of objects to CSV format
 */
export function jsonToCSV<T extends Record<string, any>>(data: T[], headers?: Record<keyof T, string>): string {
  if (data.length === 0) {
    return '';
  }

  const keys = Object.keys(data[0]) as Array<keyof T>;
  const headerRow = headers
    ? keys.map(key => headers[key] || String(key))
    : keys.map(key => String(key));

  const rows = data.map(row =>
    keys.map(key => {
      const value = row[key];

      // Handle different value types
      if (value === null || value === undefined) {
        return '';
      }

      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    }).join(',')
  );

  return [headerRow.join(','), ...rows].join('\n');
}

/**
 * Trigger a CSV file download in the browser
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format minutes to hours and minutes string for CSV
 */
export function formatMinutesForCSV(minutes: number | null): string {
  if (!minutes && minutes !== 0) return '0h 0m';
  const hours = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? '-' : '';
  return `${sign}${hours}h ${mins}m`;
}
