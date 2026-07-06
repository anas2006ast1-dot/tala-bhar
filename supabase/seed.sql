-- ============================================================
--  طلة بحر SeaView — Seed Data (من المنيو الرسمي)
--  ملاحظة: هذا الملف يحذف الأصناف القديمة ويزرع منيو SeaView الجديد.
--  شغّله في Supabase SQL Editor.
-- ============================================================

-- Clean old data --------------------------------------------
delete from public.menu_items;
delete from public.categories;

-- Categories (ترتيب حسب المنيو الأصلي) -----------------------
insert into public.categories (name_ar, name_en, icon, sort_order, is_visible) values
  ('الشوربات',                   'Soups',            '🍲',        1, true),
  ('السلطات',                    'Salads',           '🥗',        2, true),
  ('الشرمب والمأكولات البحرية',  'Shrimp & Seafood', '🦐',        3, true),
  ('سي فود باكيت',               'Seafood Packet',   '🦑',        4, true),
  ('طواجن الجمبري',              'Shrimp Tagines',   'CookingPot', 5, true),
  ('طواجن السمك',                'Fish Tagines',     'CookingPot', 6, true),
  ('فيليه السمك',                'Fish Fillet',      '🐟',        7, true),
  ('المشاريب',                   'Drinks',           '🥤',        8, true),
  ('المشروبات الساخنة',          'Hot Drinks',       'Coffee',    9, true);

-- Menu items -----------------------------------------------
insert into public.menu_items (category_id, name_ar, name_en, description_ar, price, is_available, is_featured, sort_order, image_url) values
-- الشوربات
((select id from categories where name_ar='الشوربات'), 'شوربة كريمة', 'Cream Soup', 'دفء البحر في طبق', 20, true, false, 1, null),
((select id from categories where name_ar='الشوربات'), 'شوربة طلة بحر', 'Talat Bahr Soup', 'شوربة المطعم الخاصة بالمأكولات البحرية', 30, true, true, 2, null),

-- السلطات
((select id from categories where name_ar='السلطات'), 'بقدونسية', 'Parsley Salad', null, 7, true, false, 1, null),
((select id from categories where name_ar='السلطات'), 'تركية', 'Turkish Salad', null, 7, true, false, 2, null),
((select id from categories where name_ar='السلطات'), 'ملفوف أحمر', 'Red Cabbage', null, 7, true, false, 3, null),
((select id from categories where name_ar='السلطات'), 'حمص', 'Hummus', null, 10, true, false, 4, null),
((select id from categories where name_ar='السلطات'), 'فلاحية', 'Falahiya Salad', null, 10, true, false, 5, null),
((select id from categories where name_ar='السلطات'), 'غزاوية', 'Gazan Salad', null, 15, true, false, 6, null),
((select id from categories where name_ar='السلطات'), 'فرادورا ماري', 'Fradura Mare', null, 35, true, true, 7, null),

-- الشرمب والمأكولات البحرية
((select id from categories where name_ar='الشرمب والمأكولات البحرية'), 'شرمب سكامبي', 'Shrimp Scampi', null, 50, true, false, 1, null),
((select id from categories where name_ar='الشرمب والمأكولات البحرية'), 'شرمب بتر فلاي', 'Butterfly Shrimp', null, 65, true, true, 2, null),
((select id from categories where name_ar='الشرمب والمأكولات البحرية'), 'شرمب بريدد', 'Breaded Shrimp', null, 50, true, false, 3, null),
((select id from categories where name_ar='الشرمب والمأكولات البحرية'), 'شرمب جرل', 'Grilled Shrimp', null, 50, true, false, 4, null),
((select id from categories where name_ar='الشرمب والمأكولات البحرية'), 'شرمب فرايد', 'Fried Shrimp', null, 50, true, false, 5, null),
((select id from categories where name_ar='الشرمب والمأكولات البحرية'), 'شرمب جرل بربيريا', 'Grilled Shrimp Berberia', null, 65, true, false, 6, null),
((select id from categories where name_ar='الشرمب والمأكولات البحرية'), 'شرمب شاك', 'Shrimp Shack', null, 65, true, false, 7, null),
((select id from categories where name_ar='الشرمب والمأكولات البحرية'), 'شرمب ديناميت', 'Dynamite Shrimp', null, 60, true, true, 8, null),

-- سي فود باكيت
((select id from categories where name_ar='سي فود باكيت'), 'سي فود بويل', 'Seafood Boil', 'باكيت مأكولات بحرية مشكلة', 150, true, true, 1, null),
((select id from categories where name_ar='سي فود باكيت'), 'سي فود ناتا', 'Seafood Nata', 'باكيت مأكولات بحرية مشكلة', 150, true, false, 2, null),
((select id from categories where name_ar='سي فود باكيت'), 'سي فود لادو ليمونو', 'Seafood Lado Limono', 'باكيت مأكولات بحرية مشكلة', 150, true, false, 3, null),

-- طواجن الجمبري
((select id from categories where name_ar='طواجن الجمبري'), 'طاجن جمبري كاري', 'Curry Shrimp Tagine', null, 80, true, false, 1, null),
((select id from categories where name_ar='طواجن الجمبري'), 'زبدية جمبري — صغير', 'Shrimp Zebdia — Small', null, 50, true, false, 2, null),
((select id from categories where name_ar='طواجن الجمبري'), 'زبدية جمبري — كبير', 'Shrimp Zebdia — Large', null, 80, true, false, 3, null),
((select id from categories where name_ar='طواجن الجمبري'), 'فروتي دي ماري', 'Frutti di Mare', null, 100, true, true, 4, null),

-- طواجن السمك (الأسعار غير مذكورة في المنيو — حدّثها من لوحة التحكم)
((select id from categories where name_ar='طواجن السمك'), 'طاجن حريمة مغربي', 'Moroccan Hraima Tagine', null, 0, true, false, 1, null),
((select id from categories where name_ar='طواجن السمك'), 'طاجن طحينة وبصل', 'Tahini & Onion Tagine', null, 0, true, false, 2, null),

-- فيليه السمك
((select id from categories where name_ar='فيليه السمك'), 'سلمون ناتا', 'Salmon Nata', null, 70, true, true, 1, null),
((select id from categories where name_ar='فيليه السمك'), 'سلمون لادو ليمونو', 'Salmon Lado Limono', null, 70, true, false, 2, null),
((select id from categories where name_ar='فيليه السمك'), 'سلمون صويا وعسل', 'Soy & Honey Salmon', null, 70, true, false, 3, null),
((select id from categories where name_ar='فيليه السمك'), 'فيليه سي باس بربيريا', 'Sea Bass Fillet Berberia', null, 70, true, false, 4, null),

-- المشاريب
((select id from categories where name_ar='المشاريب'), 'ليمون ونعنع فرش', 'Fresh Lemon Mint', null, 20, true, true, 1, null),
((select id from categories where name_ar='المشاريب'), 'بلو موهيتو', 'Blue Mojito', null, 25, true, false, 2, null),
((select id from categories where name_ar='المشاريب'), 'موهيتو فواكه', 'Fruit Mojito', null, 25, true, false, 3, null),
((select id from categories where name_ar='المشاريب'), 'موهيتو كيوي', 'Kiwi Mojito', null, 25, true, false, 4, null),
((select id from categories where name_ar='المشاريب'), 'سبرايت', 'Sprite', null, 7, true, false, 5, null),
((select id from categories where name_ar='المشاريب'), 'كوكاكولا', 'Coca-Cola', null, 7, true, false, 6, null),

-- المشروبات الساخنة
((select id from categories where name_ar='المشروبات الساخنة'), 'شاي', 'Tea', null, 8, true, false, 1, null),
((select id from categories where name_ar='المشروبات الساخنة'), 'قهوة — سنجل', 'Coffee — Single', null, 7, true, false, 2, null),
((select id from categories where name_ar='المشروبات الساخنة'), 'قهوة — دبل', 'Coffee — Double', null, 10, true, false, 3, null),
((select id from categories where name_ar='المشروبات الساخنة'), 'نسكافيه', 'Nescafé', null, 10, true, false, 4, null);

-- Settings -------------------------------------------------
update public.settings set
  name_ar    = 'طلة بحر',
  name_en    = 'Sea View',
  tagline_ar = 'مطعم مأكولات بحرية فاخر',
  currency   = '₪',
  logo_url   = '/logo.jpg'
where id = 1;
