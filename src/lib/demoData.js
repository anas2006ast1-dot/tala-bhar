/**
 * Demo data — يُستخدم تلقائياً عند عدم ضبط Supabase،
 * ليظهر المنيو فوراً في المتصفح بدون قاعدة بيانات.
 */
const uid = (s) => s // deterministic ids for demo

export const demoCategories = [
  { id: 'c1', name_ar: 'المقبلات البحرية', name_en: 'Seafood Appetizers', icon: '🦐', sort_order: 1, is_visible: true },
  { id: 'c2', name_ar: 'الشوربات', name_en: 'Soups', icon: '🍲', sort_order: 2, is_visible: true },
  { id: 'c3', name_ar: 'المشاوي البحرية', name_en: 'Grilled Seafood', icon: '🔥', sort_order: 3, is_visible: true },
  { id: 'c4', name_ar: 'السمك المقلي', name_en: 'Fried Fish', icon: '🐟', sort_order: 4, is_visible: true },
  { id: 'c5', name_ar: 'المأكولات والربيان', name_en: 'Seafood & Shrimp', icon: '🦑', sort_order: 5, is_visible: true },
  { id: 'c6', name_ar: 'الأرز والمشاوي', name_en: 'Rice & Grills', icon: '🍚', sort_order: 6, is_visible: true },
  { id: 'c7', name_ar: 'السلطات', name_en: 'Salads', icon: '🥗', sort_order: 7, is_visible: true },
  { id: 'c8', name_ar: 'العصائر والمشروبات', name_en: 'Juices & Drinks', icon: '🥤', sort_order: 8, is_visible: true },
  { id: 'c9', name_ar: 'الحلويات', name_en: 'Desserts', icon: '🍮', sort_order: 9, is_visible: true },
]

export const demoItems = [
  // المقبلات
  { id: 'i1', category_id: 'c1', name_ar: 'حمص بالطحينة', name_en: 'Hummus', description_ar: 'حمص كريمي مع زيت الزيتون', price: 18, is_available: true, is_featured: false, sort_order: 1, image_url: '' },
  { id: 'i2', category_id: 'c1', name_ar: 'متبل الباذنجان', name_en: 'Mutabbal', description_ar: 'باذنجان مشوي مع طحينة ولبن', price: 18, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i3', category_id: 'c1', name_ar: 'تبولة', name_en: 'Tabbouleh', description_ar: 'بقدونس طازج، برغل، طماطم ونعناع', price: 20, is_available: true, is_featured: false, sort_order: 3, image_url: '' },
  { id: 'i4', category_id: 'c1', name_ar: 'فتوش', name_en: 'Fattoush', description_ar: 'خضار موسمية مع خبز محمص ودبس الرمان', price: 22, is_available: true, is_featured: false, sort_order: 4, image_url: '' },
  { id: 'i5', category_id: 'c1', name_ar: 'كبة مقلية', name_en: 'Fried Kibbeh', description_ar: 'كبة برغل محشية لحماً وصنوبراً', price: 26, is_available: true, is_featured: true, sort_order: 5, image_url: '' },
  { id: 'i6', category_id: 'c1', name_ar: 'ربيان مقلي مقبلات', name_en: 'Fried Shrimp', description_ar: 'ربيان مقلي مع صلصة حارة', price: 35, is_available: true, is_featured: true, sort_order: 6, image_url: '' },

  // الشوربات
  { id: 'i7', category_id: 'c2', name_ar: 'شوربة بحرية', name_en: 'Seafood Soup', description_ar: 'شوربة غنية بالمأكولات البحرية', price: 24, is_available: true, is_featured: true, sort_order: 1, image_url: '' },
  { id: 'i8', category_id: 'c2', name_ar: 'شوربة الربيان', name_en: 'Shrimp Soup', description_ar: 'شوربة كريمية بالربيان', price: 26, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i9', category_id: 'c2', name_ar: 'شوربة سمك', name_en: 'Fish Soup', description_ar: 'قطع سمك طازج مع خضار', price: 24, is_available: true, is_featured: false, sort_order: 3, image_url: '' },

  // المشاوي البحرية
  { id: 'i10', category_id: 'c3', name_ar: 'سمك مشوي', name_en: 'Grilled Fish', description_ar: 'سمك اليوم المشوي مع الأعشاب', price: 75, is_available: true, is_featured: true, sort_order: 1, image_url: '' },
  { id: 'i11', category_id: 'c3', name_ar: 'كاليماري مشوي', name_en: 'Grilled Calamari', description_ar: 'حبار مشوي مع صلصة الليمون', price: 68, is_available: true, is_featured: true, sort_order: 2, image_url: '' },
  { id: 'i12', category_id: 'c3', name_ar: 'ربيان مشوي', name_en: 'Grilled Shrimp', description_ar: 'ربيان بلدي مشوي بالثوم والليمون', price: 82, is_available: true, is_featured: true, sort_order: 3, image_url: '' },
  { id: 'i13', category_id: 'c3', name_ar: 'سمك دنيس مشوي', name_en: 'Grilled Denis', description_ar: 'دنيس طازج مشوي على الفحم', price: 95, is_available: true, is_featured: true, sort_order: 4, image_url: '' },
  { id: 'i14', category_id: 'c3', name_ar: 'سمك لوقس مشوي', name_en: 'Grilled Lukas', description_ar: 'لوقس مشوي مع بطاطا وسلطة', price: 90, is_available: false, is_featured: false, sort_order: 5, image_url: '' },

  // السمك المقلي
  { id: 'i15', category_id: 'c4', name_ar: 'سمك مقلي', name_en: 'Fried Fish', description_ar: 'سمك يوم مقلي مقرمش', price: 65, is_available: true, is_featured: true, sort_order: 1, image_url: '' },
  { id: 'i16', category_id: 'c4', name_ar: 'سمك موسى مقلي', name_en: 'Fried Sole', description_ar: 'موسى مقلي مع صلصة الطرخونة', price: 70, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i17', category_id: 'c4', name_ar: 'سمك مرجان مقلي', name_en: 'Fried Coral Fish', description_ar: 'مرجان مقلي مع بطاطا', price: 68, is_available: true, is_featured: false, sort_order: 3, image_url: '' },

  // المأكولات والربيان
  { id: 'i18', category_id: 'c5', name_ar: 'صحن بحري مشكل', name_en: 'Mixed Seafood Platter', description_ar: 'تشكيلة سمك وربيان وحبار مشوي', price: 180, is_available: true, is_featured: true, sort_order: 1, image_url: '' },
  { id: 'i19', category_id: 'c5', name_ar: 'ربيان بالثوم', name_en: 'Garlic Shrimp', description_ar: 'ربيان مقلي بالثوم والزبدة', price: 78, is_available: true, is_featured: true, sort_order: 2, image_url: '' },
  { id: 'i20', category_id: 'c5', name_ar: 'كاليماري مقلي', name_en: 'Fried Calamari', description_ar: 'حبار مقلي مقرمش مع الليمون', price: 65, is_available: true, is_featured: true, sort_order: 3, image_url: '' },
  { id: 'i21', category_id: 'c5', name_ar: 'أصابع الربيان', name_en: 'Shrimp Fingers', description_ar: 'ربيان مغلف بالبقسماط مقلي', price: 60, is_available: true, is_featured: false, sort_order: 4, image_url: '' },

  // الأرز والمشاوي
  { id: 'i22', category_id: 'c6', name_ar: 'صيادية', name_en: 'Sayadiyah', description_ar: 'أرز بالسمك والبهارات البحرية', price: 55, is_available: true, is_featured: true, sort_order: 1, image_url: '' },
  { id: 'i23', category_id: 'c6', name_ar: 'كبسة ربيان', name_en: 'Shrimp Kabsa', description_ar: 'أرز بهار مع ربيان طازج', price: 72, is_available: true, is_featured: true, sort_order: 2, image_url: '' },
  { id: 'i24', category_id: 'c6', name_ar: 'مندي سمك', name_en: 'Fish Mandi', description_ar: 'أرز مندي مع سمك مشوي', price: 70, is_available: true, is_featured: false, sort_order: 3, image_url: '' },
  { id: 'i25', category_id: 'c6', name_ar: 'مشاوي مشكلة', name_en: 'Mixed Grill', description_ar: 'تشكيلة لحوم مشوية مع أرز', price: 95, is_available: true, is_featured: true, sort_order: 4, image_url: '' },

  // السلطات
  { id: 'i26', category_id: 'c7', name_ar: 'سلطة بحرية', name_en: 'Seafood Salad', description_ar: 'خضار طازجة مع ربيان وسمك', price: 32, is_available: true, is_featured: true, sort_order: 1, image_url: '' },
  { id: 'i27', category_id: 'c7', name_ar: 'سلطة جرجر', name_en: 'Rocket Salad', description_ar: 'جرجر مع طماطم وبصل وليمون', price: 18, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i28', category_id: 'c7', name_ar: 'سلطة الملفوف', name_en: 'Coleslaw', description_ar: 'كرنب وملفوف مع صوص كريمي', price: 16, is_available: true, is_featured: false, sort_order: 3, image_url: '' },

  // العصائر
  { id: 'i29', category_id: 'c8', name_ar: 'ليمون بالنعناع', name_en: 'Lemon Mint', description_ar: 'عصير ليمون طازج بالنعناع', price: 14, is_available: true, is_featured: true, sort_order: 1, image_url: '' },
  { id: 'i30', category_id: 'c8', name_ar: 'عصير برتقال', name_en: 'Orange Juice', description_ar: 'عصير برتقال طبيعي طازج', price: 14, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i31', category_id: 'c8', name_ar: 'ماء', name_en: 'Mineral Water', description_ar: 'مياه معدنية', price: 5, is_available: true, is_featured: false, sort_order: 3, image_url: '' },
  { id: 'i32', category_id: 'c8', name_ar: 'مشروبات غازية', name_en: 'Soft Drinks', description_ar: 'كوكا كولا، سبرايت، فانتا', price: 10, is_available: true, is_featured: false, sort_order: 4, image_url: '' },
  { id: 'i33', category_id: 'c8', name_ar: 'شاي', name_en: 'Tea', description_ar: 'شاي ساخن', price: 6, is_available: true, is_featured: false, sort_order: 5, image_url: '' },

  // الحلويات
  { id: 'i34', category_id: 'c9', name_ar: 'كنافة', name_en: 'Kunafa', description_ar: 'كنافة طازجة بالجبن والقطر', price: 24, is_available: true, is_featured: true, sort_order: 1, image_url: '' },
  { id: 'i35', category_id: 'c9', name_ar: 'مهلبية', name_en: 'Mahalabia', description_ar: 'مهلبية بماء الورد والفستق', price: 16, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i36', category_id: 'c9', name_ar: 'أرز بالحليب', name_en: 'Rice Pudding', description_ar: 'أرز بالحليب والقرفة', price: 16, is_available: true, is_featured: false, sort_order: 3, image_url: '' },
]

export const demoSettings = {
  id: 1,
  name_ar: 'طلة بحر',
  name_en: 'Talat Bahr',
  tagline_ar: 'مأكولات بحرية طازجة · على ضفاف البحر',
  currency: '₪',
  logo_url: '/logo.svg',
  phone: '',
  instagram: '',
  whatsapp: '',
}

/** True if Supabase env vars are not configured (demo mode). */
export const isDemo = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  return !url || url === 'your_supabase_url'
}
