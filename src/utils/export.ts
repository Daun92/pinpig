/**
 * Trigger CSV download in browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const BOM = '\uFEFF'; // UTF-8 BOM for Korean support in Excel
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate filename for export
 */
export function generateExportFilename(year: number, month: number): string {
  const monthStr = String(month).padStart(2, '0');
  return `PinPig_거래내역_${year}${monthStr}.csv`;
}

/**
 * Export and download transactions as CSV
 */
export async function exportAndDownload(
  exportFn: (year: number, month: number) => Promise<string>,
  year: number,
  month: number
): Promise<void> {
  const csvContent = await exportFn(year, month);
  const filename = generateExportFilename(year, month);
  downloadCSV(csvContent, filename);
}
