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

  const topSegment = Object.entries(summaryStats.segmentMap || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
  const topCity = Object.entries(summaryStats.cityMap || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const context = `
=== RINGKASAN DATA BISNIS ===
- Total Penjualan   : ${formatCurrency(summaryStats.totalSales)}
- Total Profit      : ${formatCurrency(summaryStats.totalProfit)}
- Total Pesanan     : ${summaryStats.totalOrders.toLocaleString('id-ID')} transaksi
- Profit Margin     : ${summaryStats.profitMargin.toFixed(2)}%
- Kategori Terlaris : ${summaryStats.topCategory}
- Segmen Teratas    : ${topSegment}
- Region Terbaik    : ${summaryStats.topRegion}
- Kota Paling Profit: ${topCity}
- Sub-Kategori Terburuk (Profit): ${summaryStats.worstSubCat}

=== TREN PENJUALAN BULANAN ===
${trendStr || 'Tidak ada data tren.'}
`.trim();

  const prompt = `
Kamu adalah seorang analis bisnis senior yang ahli dalam interpretasi data penjualan ritel.
Berikut adalah ringkasan data performa bisnis saat ini:

${context}

${customQuestion ? `Pertanyaan spesifik: ${customQuestion}` : ''}

Tolong berikan analisis dalam Bahasa Indonesia. Gunakan format yang ringkas dan mudah dipahami oleh eksekutif bisnis.
Fokus pada angka-angka kunci dan implikasinya terhadap keputusan bisnis.
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
