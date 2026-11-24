# تشخيص زيادة Supabase Egress

لم تتوفر صلاحية قراءة سجلات Supabase الفعلية في هذه الجلسة. استخدم الاستعلام للقراءة فقط في Supabase SQL Explorer، واختر مصدر `Logs` وحدد فترة الفاتورة المتأثرة قبل التنفيذ. يعرض مسارات التخزين وعدد الطلبات وحالة CDN وعنوان IP وUser-Agent. سجلات المسارات لا تقدم حجم الاستجابة الدقيق؛ لمعرفة الأعلى حجمًا، خذ حجم كل صورة من `Content-Length` أو الملف الأصلي واضربه في عدد طلباتها. اجمع النتيجة حسب bucket/path/cache status.

تحقق من تكرار طلبات كل صورة، ومن قيم `cf_cache_status`، وقارن User-Agent وعناوين IP مع متصفحات الزبائن المعروفة. يمكن للـbots وبرامج معاينة الروابط والمتصفحات الآلية تنزيل صور القائمة؛ وUser-Agent وحده لا يثبت أن الطلب إنساني أو آلي. لا تشارك نتائج IP/User-Agent علنًا؛ أرسل إجماليًا مجمعًا عند الحاجة.

Cached Egress في Supabase محسوب من Storage/CDN فقط؛ لذلك الرقم يؤكد أن التخزين هو مصدر الفئة cached، لكنه لا يثبت أن كل الطلبات صور المنيو أو زوار حقيقيون. حد Free الحالي 5GB cached و5GB uncached. الرقم المرسل 5.819GB cached يعني تجاوزًا يقارب 0.819GB. [حدود Supabase وسجل طلبات الصور](https://supabase.com/docs/guides/storage/serving/bandwidth)، [شرح الحصص والسجلات](https://supabase.com/docs/guides/platform/manage-your-usage/egress)، [حقول logs](https://supabase.com/docs/guides/observability/log-field-reference).
