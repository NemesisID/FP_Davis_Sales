const CONFIG = {
  OPENROUTER_API_KEY: 'ISI_API_KEY_IYH_KAMU_DISINI',
  OPENROUTER_MODEL:   'gemini-3-flash',

  SUPABASE_URL:      'https://YOUR_PROJECT_ID.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
  SUPABASE_TABLE:    'nama_tabel_kamu',

  DATA_SOURCE: 'supabase',

  COLUMN_MAP: {
    order_id:     'SalesOrderID',
    order_date:   'OrderDate',
    tahun:        'tahun',
    bulan:        'bulan',
    category:     'Category',
    sub_category: 'SubCategory',
    region:       'Territory',
    sales:        'Sales',
    profit:       'Profit',
  },
};
