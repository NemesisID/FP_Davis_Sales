async function callOpenRouter(prompt) {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const url = isLocalhost ? 'https://corsproxy.io/?https://v1.iyhapi.app/chat/completions' : '/api/chat';

  const headers = {
    'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({
    model: CONFIG.OPENROUTER_MODEL,
    messages: [{ role: 'user', content: prompt }],
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) throw new Error('AI returned an empty response.');

    return content.trim();

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return `⚠ Gagal menghubungi AI: Request Timeout`;
    }
    return `⚠ Gagal menghubungi AI: ${err.message}`;
  }
}


async function getInsight(summaryStats, customQuestion = '') {
  const trendStr = Object.entries(summaryStats.monthlyMap || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([m, val]) => `${m}: ${formatCurrency(val)}`)
    .join(' | ');

  const regionStr = Object.entries(summaryStats.regionMap || {})
    .sort((a, b) => b[1] - a[1])
    .map(([r, val]) => `${r}: ${formatCurrency(val)}`)
    .join('\n  ');

  const subCatStr = Object.entries(summaryStats.subCategoryMap || {})
    .sort((a, b) => b[1] - a[1])
    .map(([s, val]) => `${s}: ${formatCurrency(val)}`)
    .join('\n  ');
    
  const catStr = Object.entries(summaryStats.categoryMap || {})
    .sort((a, b) => b[1].profit - a[1].profit)
    .map(([c, val]) => `${c} (Profit: ${formatCurrency(val.profit)})`)
    .join('\n  ');

  const topSegment = Object.entries(summaryStats.segmentMap || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
  const topCity = Object.entries(summaryStats.cityMap || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const context = `
=== RINGKASAN UTAMA ===
- Total Penjualan   : ${formatCurrency(summaryStats.totalSales)}
- Total Profit      : ${formatCurrency(summaryStats.totalProfit)}
- Total Pesanan     : ${summaryStats.totalOrders.toLocaleString('id-ID')} transaksi
- Profit Margin     : ${summaryStats.profitMargin.toFixed(2)}%
- Kategori Terlaris : ${summaryStats.topCategory}
- Segmen Teratas    : ${topSegment}
- Region Terbaik    : ${summaryStats.topRegion}
- Kota Paling Profit: ${topCity}
- Sub-Kategori Terburuk (Profit): ${summaryStats.worstSubCat}

=== PROFIT PER REGION ===
  ${regionStr || 'N/A'}

=== PROFIT PER KATEGORI ===
  ${catStr || 'N/A'}

=== PROFIT PER SUB-KATEGORI ===
  ${subCatStr || 'N/A'}

=== TREN PENJUALAN BULANAN ===
  ${trendStr || 'Tidak ada data tren.'}
`.trim();

  const prompt = `
Kamu adalah seorang analis bisnis senior. Tugasmu HANYA menjawab pertanyaan seputar data penjualan berikut.
JIKA pertanyaan di luar konteks data penjualan ini (misal: "siapa kamu", pertanyaan umum, pemrograman, dll), JAWAB: "Maaf, saya hanya bisa membantu menganalisis data penjualan bisnis Anda." dan JANGAN berikan analisis tambahan.

=== DATA PENJUALAN ===
${context}

${customQuestion ? `=== PERTANYAAN ===\n${customQuestion}` : 'Berikan analisis ringkas mengenai performa bisnis ini.'}

PENTING: 
- Jawab HANYA apa yang ditanyakan.
- Jangan membuat laporan panjang jika tidak diminta.
- Gunakan Bahasa Indonesia yang profesional.
`.trim();

  return await callOpenRouter(prompt);
}


function formatCurrency(num) {
  if (num === undefined || num === null || isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}
