-- ============================================================
--  طلة بحر — Seed Data (المأكولات البحرية)
-- ============================================================

-- Categories (ترتيب حسب الظهور في المنيو الأصلي) -----------
insert into public.categories (name_ar, name_en, icon, sort_order, is_visible) values
  ('المقبلات البحرية', 'Seafood Appetizers', '🦐', 1, true),
  ('الشوربات',         'Soups',              '🍲', 2, true),
  ('المشاوي البحرية',  'Grilled Seafood',    '🔥', 3, true),
  ('السمك المقلي',     'Fried Fish',         '🐟', 4, true),
  ('المأكولات والربيان','Seafood & Shrimp',   '🦑', 5, true),
  ('الأرز والمشاوي',   'Rice & Grills',      '🍚', 6, true),
  ('السلطات',          'Salads',             '🥗', 7, true),
  ('العصائر والمشروبات','Juices & Drinks',    '🥤', 8, true),
  ('الحلويات',         'Desserts',           '🍮', 9, true)
on conflict do nothing;

-- Menu items -----------------------------------------------
insert into public.menu_items (category_id, name_ar, name_en, description_ar, price, is_available, is_featured, sort_order, image_url) values
-- المقبلات البحرية
((select id from categories where name_ar='المقبلات البحرية'), 'حمص بالطحينة', 'Hummus with Tahini', 'حمص كريمي مع زيت زيتون', 18, true, false, 1, null),
((select id from categories where name_ar='المقبلات البحرية'), 'متبل الباذنجان', 'Mutabbal', 'باذنجان مشوي مع طحينة ولبن', 18, true, false, 2, null),
((select id from categories where name_ar='المقبلات البحرية'), 'تبولة', 'Tabbouleh', 'بقدونس طازج، برغل، طماطم ونعناع', 20, true, false, 3, null),
((select id from categories where name_ar='المقبلات البحرية'), 'فتوش', 'Fattoush', 'خضار موسمية مع خبز محمص ودبس الرمان', 22, true, false, 4, null),
((select id from categories where name_ar='المقبلات البحرية'), 'كبة مقلية', 'Fried Kibbeh', 'كبة برغل محشية لحماً وصنوبراً', 26, true, true, 5, null),
((select id from categories where name_ar='المقبلات البحرية'), 'ربيان مقلي مقبلات', 'Fried Shrimp Appetizer', 'ربيان مقلي مع صلصة حارة', 35, true, true, 6, null),

-- الشوربات
((select id from categories where name_ar='الشوربات'), 'شوربة بحرية', 'Seafood Soup', 'شوربة غنية بالمأكولات البحرية', 24, true, true, 1, null),
((select id from categories where name_ar='الشوربات'), 'شوربة الربيان', 'Shrimp Soup', 'شوربة كريمية بالربيان', 26, true, false, 2, null),
((select id from categories where name_ar='الشوربات'), 'شوربة سمك', 'Fish Soup', 'قطع سمك طازج مع خضار', 24, true, false, 3, null),

-- المشاوي البحرية
((select id from categories where name_ar='المشاوي البحرية'), 'سمك مشوي', 'Grilled Fish', 'سمك اليوم المشوي مع الأعشاب', 75, true, true, 1, null),
((select id from categories where name_ar='المشاوي البحرية'), 'كاليماري مشوي', 'Grilled Calamari', 'حبار مشوي مع صلصة الليمون', 68, true, true, 2, null),
((select id from categories where name_ar='المشاوي البحرية'), 'ربيان مشوي', 'Grilled Shrimp', 'ربيان بلدي مشوي بالثوم والليمون', 82, true, true, 3, null),
((select id from categories where name_ar='المشاوي البحرية'), 'سمك دنيس مشوي', 'Grilled Denis', 'دنيس طازج مشوي على الفحم', 95, true, true, 4, null),
((select id from categories where name_ar='المشاوي البحرية'), 'سمك لوقس مشوي', 'Grilled Lukas', 'لوقس مشوي مع بطاطا وسلطة', 90, true, false, 5, null),

-- السمك المقلي
((select id from categories where name_ar='السمك المقلي'), 'سمك مقلي', 'Fried Fish', 'سمك يوم مقلي مقرمش', 65, true, true, 1, null),
((select id from categories where name_ar='السمك المقلي'), 'سمك موسى مقلي', 'Fried Sole', 'موسى مقلي مع صلصة الطرخونة', 70, true, false, 2, null),
((select id from categories where name_ar='السمك المقلي'), 'سمك مرجان مقلي', 'Fried Coral Fish', 'مرجان مقلي مع بطاطا', 68, true, false, 3, null),

-- المأكولات والربيان
((select id from categories where name_ar='المأكولات والربيان'), 'صحن بحري مشكل', 'Mixed Seafood Platter', 'تشكيلة سمك وربيان وحبار مشوي', 180, true, true, 1, null),
((select id from categories where name_ar='المأكولات والربيان'), 'ربيان بالثوم', 'Garlic Shrimp', 'ربيان مقلي بالثوم والزبدة', 78, true, true, 2, null),
((select id from categories where name_ar='المأكولات والربيان'), 'كاليماري مقلي', 'Fried Calamari', 'حبار مقلي مقرمش مع الليمون', 65, true, true, 3, null),
((select id from categories where name_ar='المأكولات والربيان'), 'أصابع الربيان', 'Shrimp Fingers', 'ربيان مغلف بالبقسماط مقلي', 60, true, false, 4, null),

-- الأرز والمشاوي
((select id from categories where name_ar='الأرز والمشاوي'), 'صيادية', 'Sayadiyah', 'أرز بالسمك والبهارات البحرية', 55, true, true, 1, null),
((select id from categories where name_ar='الأرز والمشاوي'), 'كبسة ربيان', 'Shrimp Kabsa', 'أرز بهار مع ربيان طازج', 72, true, true, 2, null),
((select id from categories where name_ar='الأرز والمشاوي'), 'مندي سمك', 'Fish Mandi', 'أرز مندي مع سمك مشوي', 70, true, false, 3, null),
((select id from categories where name_ar='الأرز والمشاوي'), 'مشاوي مشكلة', 'Mixed Grill', 'تشكيلة لحوم مشوية مع أرز', 95, true, true, 4, null),

-- السلطات
((select id from categories where name_ar='السلطات'), 'سلطة بحرية', 'Seafood Salad', 'خضار طازجة مع ربيان وسمك', 32, true, true, 1, null),
((select id from categories where name_ar='السلطات'), 'سلطة جرجر', 'Rocket Salad', 'جرجر مع طماطم وبصل وليمون', 18, true, false, 2, null),
((select id from categories where name_ar='السلطات'), 'سلطة الملفوف', 'Coleslaw', 'كرنب وملفوف مع صوص كريمي', 16, true, false, 3, null),

-- العصائر والمشروبات
((select id from categories where name_ar='العصائر والمشروبات'), 'ليمون بالنعناع', 'Lemon Mint', 'عصير ليمون طازج بالنعناع', 14, true, true, 1, null),
((select id from categories where name_ar='العصائر والمشروبات'), 'عصير برتقال', 'Orange Juice', 'عصير برتقال طبيعي طازج', 14, true, false, 2, null),
((select id from categories where name_ar='العصائر والمشروبات'), 'ماء', 'Mineral Water', 'مياه معدنية', 5, true, false, 3, null),
((select id from categories where name_ar='العصائر والمشروبات'), 'مشروبات غازية', 'Soft Drinks', 'كوكا كولا، سبرايت، فانتا', 10, true, false, 4, null),
((select id from categories where name_ar='العصائر والمشروبات'), 'شاي', 'Tea', 'شاي ساخن', 6, true, false, 5, null),

-- الحلويات
((select id from categories where name_ar='الحلويات'), 'كنافة', 'Kunafa', 'كنافة طازجة بالجبن والقطر', 24, true, true, 1, null),
((select id from categories where name_ar='الحلويات'), 'مهلبية', 'Mahalabia', 'مهلبية بماء الورد والفستق', 16, true, false, 2, null),
((select id from categories where name_ar='الحلويات'), 'أرز بالحليب', 'Rice Pudding', 'أرز بالحليب والقرفة', 16, true, false, 3, null)
on conflict do nothing;

-- Settings -------------------------------------------------
update public.settings set
  name_ar    = 'طلة بحر',
  name_en    = 'Talat Bahr',
  tagline_ar = 'مأكولات بحرية طازجة · على ضفاف البحر',
  currency   = '₪',
  phone      = '',
  instagram  = '',
  whatsapp   = ''
where id = 1;
