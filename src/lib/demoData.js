/**
 * Demo data — يُستخدم تلقائياً عند عدم ضبط Supabase،
 * ليظهر المنيو فوراً في المتصفح بدون قاعدة بيانات.
 * البيانات منقولة من منيو "طلة بحر SeaView" الرسمي.
 */

export const demoCategories = [
  { id: 'c1', name_ar: 'الشوربات', name_en: 'Soups', icon: '🍲', sort_order: 1, is_visible: true },
  { id: 'c2', name_ar: 'السلطات', name_en: 'Salads', icon: '🥗', sort_order: 2, is_visible: true },
  { id: 'c3', name_ar: 'الشرمب والمأكولات البحرية', name_en: 'Shrimp & Seafood', icon: '🦐', sort_order: 3, is_visible: true },
  { id: 'c4', name_ar: 'سي فود باكيت', name_en: 'Seafood Packet', icon: '🦑', sort_order: 4, is_visible: true },
  { id: 'c5', name_ar: 'طواجن الجمبري', name_en: 'Shrimp Tagines', icon: 'CookingPot', sort_order: 5, is_visible: true },
  { id: 'c6', name_ar: 'طواجن السمك', name_en: 'Fish Tagines', icon: 'CookingPot', sort_order: 6, is_visible: true },
  { id: 'c7', name_ar: 'فيليه السمك', name_en: 'Fish Fillet', icon: '🐟', sort_order: 7, is_visible: true },
  { id: 'c8', name_ar: 'المشاريب', name_en: 'Drinks', icon: '🥤', sort_order: 8, is_visible: true },
  { id: 'c9', name_ar: 'المشروبات الساخنة', name_en: 'Hot Drinks', icon: 'Coffee', sort_order: 9, is_visible: true },
]

export const demoItems = [
  // الشوربات
  { id: 'i1', category_id: 'c1', name_ar: 'شوربة كريمة', name_en: 'Cream Soup', description_ar: 'دفء البحر في طبق', price: 20, is_available: true, is_featured: false, sort_order: 1, image_url: '' },
  { id: 'i2', category_id: 'c1', name_ar: 'شوربة طلة بحر', name_en: 'Talat Bahr Soup', description_ar: 'شوربة المطعم الخاصة بالمأكولات البحرية', price: 30, is_available: true, is_featured: true, sort_order: 2, image_url: '' },

  // السلطات
  { id: 'i3', category_id: 'c2', name_ar: 'بقدونسية', name_en: 'Parsley Salad', description_ar: '', price: 7, is_available: true, is_featured: false, sort_order: 1, image_url: '' },
  { id: 'i4', category_id: 'c2', name_ar: 'تركية', name_en: 'Turkish Salad', description_ar: '', price: 7, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i5', category_id: 'c2', name_ar: 'ملفوف أحمر', name_en: 'Red Cabbage', description_ar: '', price: 7, is_available: true, is_featured: false, sort_order: 3, image_url: '' },
  { id: 'i6', category_id: 'c2', name_ar: 'حمص', name_en: 'Hummus', description_ar: '', price: 10, is_available: true, is_featured: false, sort_order: 4, image_url: '' },
  { id: 'i7', category_id: 'c2', name_ar: 'فلاحية', name_en: 'Falahiya Salad', description_ar: '', price: 10, is_available: true, is_featured: false, sort_order: 5, image_url: '' },
  { id: 'i8', category_id: 'c2', name_ar: 'غزاوية', name_en: 'Gazan Salad', description_ar: '', price: 15, is_available: true, is_featured: false, sort_order: 6, image_url: '' },
  { id: 'i9', category_id: 'c2', name_ar: 'فرادورا ماري', name_en: 'Fradura Mare', description_ar: '', price: 35, is_available: true, is_featured: true, sort_order: 7, image_url: '' },

  // الشرمب والمأكولات البحرية
  { id: 'i10', category_id: 'c3', name_ar: 'شرمب سكامبي', name_en: 'Shrimp Scampi', description_ar: '', price: 50, is_available: true, is_featured: false, sort_order: 1, image_url: '' },
  { id: 'i11', category_id: 'c3', name_ar: 'شرمب بتر فلاي', name_en: 'Butterfly Shrimp', description_ar: '', price: 65, is_available: true, is_featured: true, sort_order: 2, image_url: '' },
  { id: 'i12', category_id: 'c3', name_ar: 'شرمب بريدد', name_en: 'Breaded Shrimp', description_ar: '', price: 50, is_available: true, is_featured: false, sort_order: 3, image_url: '' },
  { id: 'i13', category_id: 'c3', name_ar: 'شرمب جرل', name_en: 'Grilled Shrimp', description_ar: '', price: 50, is_available: true, is_featured: false, sort_order: 4, image_url: '' },
  { id: 'i14', category_id: 'c3', name_ar: 'شرمب فرايد', name_en: 'Fried Shrimp', description_ar: '', price: 50, is_available: true, is_featured: false, sort_order: 5, image_url: '' },
  { id: 'i15', category_id: 'c3', name_ar: 'شرمب جرل بربيريا', name_en: 'Grilled Shrimp Berberia', description_ar: '', price: 65, is_available: true, is_featured: false, sort_order: 6, image_url: '' },
  { id: 'i16', category_id: 'c3', name_ar: 'شرمب شاك', name_en: 'Shrimp Shack', description_ar: '', price: 65, is_available: true, is_featured: false, sort_order: 7, image_url: '' },
  { id: 'i17', category_id: 'c3', name_ar: 'شرمب ديناميت', name_en: 'Dynamite Shrimp', description_ar: '', price: 60, is_available: true, is_featured: true, sort_order: 8, image_url: '' },

  // سي فود باكيت
  { id: 'i18', category_id: 'c4', name_ar: 'سي فود بويل', name_en: 'Seafood Boil', description_ar: 'باكيت مأكولات بحرية مشكلة', price: 150, is_available: true, is_featured: true, sort_order: 1, image_url: '' },
  { id: 'i19', category_id: 'c4', name_ar: 'سي فود ناتا', name_en: 'Seafood Nata', description_ar: 'باكيت مأكولات بحرية مشكلة', price: 150, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i20', category_id: 'c4', name_ar: 'سي فود لادو ليمونو', name_en: 'Seafood Lado Limono', description_ar: 'باكيت مأكولات بحرية مشكلة', price: 150, is_available: true, is_featured: false, sort_order: 3, image_url: '' },

  // طواجن الجمبري
  { id: 'i21', category_id: 'c5', name_ar: 'طاجن جمبري كاري', name_en: 'Curry Shrimp Tagine', description_ar: '', price: 80, is_available: true, is_featured: false, sort_order: 1, image_url: '' },
  { id: 'i22', category_id: 'c5', name_ar: 'زبدية جمبري — صغير', name_en: 'Shrimp Zebdia — Small', description_ar: '', price: 50, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i23', category_id: 'c5', name_ar: 'زبدية جمبري — كبير', name_en: 'Shrimp Zebdia — Large', description_ar: '', price: 80, is_available: true, is_featured: false, sort_order: 3, image_url: '' },
  { id: 'i24', category_id: 'c5', name_ar: 'فروتي دي ماري', name_en: 'Frutti di Mare', description_ar: '', price: 100, is_available: true, is_featured: true, sort_order: 4, image_url: '' },

  // طواجن السمك (الأسعار غير مذكورة في المنيو — تُضبط من لوحة التحكم)
  { id: 'i25', category_id: 'c6', name_ar: 'طاجن حريمة مغربي', name_en: 'Moroccan Hraima Tagine', description_ar: '', price: 0, is_available: true, is_featured: false, sort_order: 1, image_url: '' },
  { id: 'i26', category_id: 'c6', name_ar: 'طاجن طحينة وبصل', name_en: 'Tahini & Onion Tagine', description_ar: '', price: 0, is_available: true, is_featured: false, sort_order: 2, image_url: '' },

  // فيليه السمك
  { id: 'i27', category_id: 'c7', name_ar: 'سلمون ناتا', name_en: 'Salmon Nata', description_ar: '', price: 70, is_available: true, is_featured: true, sort_order: 1, image_url: '' },
  { id: 'i28', category_id: 'c7', name_ar: 'سلمون لادو ليمونو', name_en: 'Salmon Lado Limono', description_ar: '', price: 70, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i29', category_id: 'c7', name_ar: 'سلمون صويا وعسل', name_en: 'Soy & Honey Salmon', description_ar: '', price: 70, is_available: true, is_featured: false, sort_order: 3, image_url: '' },
  { id: 'i30', category_id: 'c7', name_ar: 'فيليه سي باس بربيريا', name_en: 'Sea Bass Fillet Berberia', description_ar: '', price: 70, is_available: true, is_featured: false, sort_order: 4, image_url: '' },

  // المشاريب
  { id: 'i31', category_id: 'c8', name_ar: 'ليمون ونعنع فرش', name_en: 'Fresh Lemon Mint', description_ar: '', price: 20, is_available: true, is_featured: true, sort_order: 1, image_url: '' },
  { id: 'i32', category_id: 'c8', name_ar: 'بلو موهيتو', name_en: 'Blue Mojito', description_ar: '', price: 25, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i33', category_id: 'c8', name_ar: 'موهيتو فواكه', name_en: 'Fruit Mojito', description_ar: '', price: 25, is_available: true, is_featured: false, sort_order: 3, image_url: '' },
  { id: 'i34', category_id: 'c8', name_ar: 'موهيتو كيوي', name_en: 'Kiwi Mojito', description_ar: '', price: 25, is_available: true, is_featured: false, sort_order: 4, image_url: '' },
  { id: 'i35', category_id: 'c8', name_ar: 'سبرايت', name_en: 'Sprite', description_ar: '', price: 7, is_available: true, is_featured: false, sort_order: 5, image_url: '' },
  { id: 'i36', category_id: 'c8', name_ar: 'كوكاكولا', name_en: 'Coca-Cola', description_ar: '', price: 7, is_available: true, is_featured: false, sort_order: 6, image_url: '' },

  // المشروبات الساخنة
  { id: 'i37', category_id: 'c9', name_ar: 'شاي', name_en: 'Tea', description_ar: '', price: 8, is_available: true, is_featured: false, sort_order: 1, image_url: '' },
  { id: 'i38', category_id: 'c9', name_ar: 'قهوة — سنجل', name_en: 'Coffee — Single', description_ar: '', price: 7, is_available: true, is_featured: false, sort_order: 2, image_url: '' },
  { id: 'i39', category_id: 'c9', name_ar: 'قهوة — دبل', name_en: 'Coffee — Double', description_ar: '', price: 10, is_available: true, is_featured: false, sort_order: 3, image_url: '' },
  { id: 'i40', category_id: 'c9', name_ar: 'نسكافيه', name_en: 'Nescafé', description_ar: '', price: 10, is_available: true, is_featured: false, sort_order: 4, image_url: '' },
]

export const demoSettings = {
  id: 1,
  name_ar: 'طلة بحر',
  name_en: 'Sea View',
  tagline_ar: 'مطعم مأكولات بحرية فاخر',
  currency: '₪',
  logo_url: '/logo.jpg',
  phone: '',
  instagram: '',
  whatsapp: '',
}

/** True if Supabase env vars are not configured (demo mode). */
export const isDemo = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  return !url || url === 'your_supabase_url'
}
