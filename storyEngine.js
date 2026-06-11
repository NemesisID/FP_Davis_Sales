/**
 * storyEngine.js
 * The SCR Narrative Brain — Setup, Conflict, Resolution
 * Provides: generateStory, parseStoryResponse, generateTitle
 */


/**
 * generateStory
 * Builds a rich prompt containing business summary + anomaly data, then
 * instructs the LLM to write a business narrative in strict SCR format
 * in Indonesian (max 6 sentences total: 2 per section).
 *
 * @param {object} summary  — Output of computeSummary() from app.js
 * @param {object} anomalies — Output of detectAllAnomalies()
 * @returns {Promise<string>} Raw LLM text with SETUP/CONFLICT/RESOLUTION headers
 */
async function generateStory(summary, anomalies) {
  const { profitOutliers, momSpikes } = anomalies;

  // Worst profit outlier (already sorted ascending by Z-Score)
  const worstProfit = profitOutliers[0];
  const worstMoM    = momSpikes
    .filter(s => s.momPct < 0)
    .sort((a, b) => a.momPct - b.momPct)[0];

  const anomalyContext = [
    worstProfit
      ? `Sub-kategori "${worstProfit.subCat}" memiliki margin profit ${worstProfit.margin.toFixed(1)}% (Z-Score: ${worstProfit.z.toFixed(2)})`
      : null,
    worstMoM
      ? `Penjualan bulan ${worstMoM.month} turun ${Math.abs(worstMoM.momPct).toFixed(1)}% dari bulan sebelumnya`
      : null,
  ].filter(Boolean).join('; ');

  const prompt = `
Kamu adalah seorang Chief Data Officer yang menyampaikan laporan eksekutif kepada CEO.
Gunakan kerangka Data Storytelling SCR (Setup - Conflict - Resolution).

=== DATA BISNIS ===
- Total Penjualan  : $${summary.totalSales.toLocaleString('en-US', { maximumFractionDigits: 0 })}
- Total Profit     : $${summary.totalProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
- Profit Margin    : ${summary.profitMargin.toFixed(2)}%
- Top Kategori     : ${summary.topCategory}
- Top Region       : ${summary.topRegion}
- Sub-Kategori Terburuk: ${summary.worstSubCat}

=== ANOMALI TERDETEKSI ===
${anomalyContext || 'Tidak ada anomali kritis.'}

=== INSTRUKSI FORMAT ===
Tulis TEPAT dalam format berikut (tanpa teks lain di luar format ini):

**SETUP**
[Maksimal 2 kalimat: gambarkan konteks bisnis secara positif — performa keseluruhan, tren baik.]

**CONFLICT**
[Maksimal 2 kalimat: ungkapkan masalah utama berdasarkan anomali yang terdeteksi — spesifik dan tajam.]

**RESOLUTION**
[Maksimal 2 kalimat: berikan rekomendasi tindakan konkret yang bisa diambil manajemen segera.]

Gunakan Bahasa Indonesia yang formal dan ringkas. Total maksimal 6 kalimat.
`.trim();

  return await callOpenRouter(prompt);
}


/**
 * parseStoryResponse
 * Uses regex to extract text blocks under **SETUP**, **CONFLICT**,
 * and **RESOLUTION** headers from the LLM response string.
 *
 * @param {string} text — Raw LLM response
 * @returns {{ setup: string, conflict: string, resolution: string }}
 */
function parseStoryResponse(text) {
  if (!text) return { setup: '', conflict: '', resolution: '' };

  // Normalize: remove extra whitespace, handle bold markdown
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  /**
   * Generic extractor — captures everything between a section header
   * and either the next header OR end of string.
   * Handles: **SETUP**, ## SETUP, SETUP:, etc.
   */
  function extract(label) {
    // Pattern: optional **, ##, or #, then the label word, optional :, then content
    const pattern = new RegExp(
      `(?:\\*{0,2}#{0,3}\\s*${label}\\s*\\*{0,2}:?\\s*\\n)([\\s\\S]*?)(?=\\n\\*{0,2}#{0,3}\\s*(?:SETUP|CONFLICT|RESOLUTION)\\s*\\*{0,2}:?|$)`,
      'i'
    );
    const match = normalized.match(pattern);
    return match ? match[1].trim() : '';
  }

  return {
    setup:      extract('SETUP'),
    conflict:   extract('CONFLICT'),
    resolution: extract('RESOLUTION'),
  };
}


/**
 * generateTitle
 * Instructs the LLM to write ONE narrative, insight-driven dashboard title
 * in Indonesian (max 12 words) based on the worst detected anomaly.
 *
 * @param {object} summary   — Output of computeSummary()
 * @param {object} anomalies — Output of detectAllAnomalies()
 * @returns {Promise<string>} A single concise title string
 */
async function generateTitle(summary, anomalies) {
  const { profitOutliers, momSpikes } = anomalies;

  // Identify the worst single anomaly to center the title on
  const worstProfit = profitOutliers[0];
  const worstDrop   = momSpikes
    .filter(s => s.momPct < 0)
    .sort((a, b) => a.momPct - b.momPct)[0];

  let worstFact = '';
  if (worstProfit && worstDrop) {
    // Compare which is more severe in business impact
    worstFact = worstProfit.z < -2
      ? `Sub-kategori "${worstProfit.subCat}" menyebabkan kerugian margin ${worstProfit.margin.toFixed(1)}%`
      : `Penjualan anjlok ${Math.abs(worstDrop.momPct).toFixed(1)}% pada ${worstDrop.month}`;
  } else if (worstProfit) {
    worstFact = `Sub-kategori "${worstProfit.subCat}" bermasalah: margin ${worstProfit.margin.toFixed(1)}%`;
  } else if (worstDrop) {
    worstFact = `Penjualan turun ${Math.abs(worstDrop.momPct).toFixed(1)}% pada ${worstDrop.month}`;
  } else {
    worstFact = `Performa bisnis stabil dengan margin ${summary.profitMargin.toFixed(1)}%`;
  }

  const prompt = `
Kamu adalah seorang editor laporan eksekutif bisnis.
Berdasarkan fakta berikut, tulis SATU judul dashboard yang:
- Berbahasa Indonesia
- Maksimal 12 kata
- Bersifat naratif dan berbasis insight (bukan deskriptif generik)
- Mencerminkan urgensi atau temuan utama
- TIDAK menggunakan tanda petik, tanda seru, atau emoji

Fakta utama: ${worstFact}
Total Profit: $${summary.totalProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })} | Margin: ${summary.profitMargin.toFixed(2)}%

Jawab HANYA dengan teks judul saja. Tidak ada kalimat pengantar. Tidak ada tanda kutip.
`.trim();

  const raw = await callOpenRouter(prompt);

  // Strip any stray markdown, quotes, or line breaks
  return raw
    .replace(/["""''*_#\n\r]/g, '')
    .replace(/^\s*[-–—]\s*/, '')
    .trim();
}
