// components/portal/csv-export.ts
// Client-side CSV generator for registry data

export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row.map(val => {
      let str = String(val ?? '');
      // Escape double quotes
      str = str.replace(/"/g, '""');
      if (str.search(/("|,|\n)/g) >= 0) {
        str = `"${str}"`;
      }
      return str;
    }).join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(processRow).join('\r\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
