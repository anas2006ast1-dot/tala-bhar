# تشخيص زيادة Supabase Egress

لم تتوفر صلاحية قراءة سجلات Supabase الفعلية في هذه الجلسة. استخدم الاستعلام للقراءة فقط في Supabase SQL Explorer، واختر مصدر `Logs` وحدد فترة الفاتورة المتأثرة قبل التنفيذ. يعرض أعلى مسارات التخزين حسب الحجم التقديري وعدد الطلبات وحالة CDN وعنوان IP وUser-Agent.

تحقق من تكرار طلبات كل صورة، ومن قيم `cf_cache_status`، وقارن User-Agent وعناوين IP مع متصفحات الزبائن المعروفة. يمكن للـbots وبرامج معاينة الروابط والمتصفحات الآلية تنزيل صور القائمة؛ وUser-Agent وحده لا يثبت أن الطلب إنساني أو آلي. لا تشارك نتائج IP/User-Agent علنًا؛ أرسل إجماليًا مجمعًا عند الحاجة.

Supabase Free موثق حاليًا بحد 5GB cached + 5GB uncached شهريًا. الرقم المرسل 5.819GB cached يعني تجاوزًا تقريبيًا بمقدار 0.819GB. [الحدود وطريقة عرض سجلات الصور](https://supabase.com/docs/guides/storage/serving/bandwidth)، [شرح cached egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress)، [حقول logs](https://supabase.com/docs/guides/observability/log-field-reference).

صور المنيو العامة في Storage تُطلب عادةً من عناصر `<img>` بوضع `no-cors`، فيخفي المتصفح حالة HTTP في استجابة `opaque`. الـService Worker يطلب صورة المسار العام مجددًا بوضع CORS مع إسقاط بيانات الاعتماد؛ يخزنها فقط عندما يستطيع قراءة استجابة 2xx. إذا لم يسمح Supabase CORS، يرجع إلى طلب الصورة الأصلي كي لا تنكسر الواجهة، لكنه لا يخزن الاستجابة opaque لأن حالتها قد تكون 404. قد يسبب فشل CORS طلبًا إضافيًا عند أول تحميل؛ تحقّق في Vercel Preview من استجابة CORS قبل نشر الإنتاج. اختبر من Network أن طلب الصورة الأول ينجح بـCORS، وعند إعادة فتح الصفحة لا يعيد تنزيل البايتات. بيانات قاعدة البيانات وAuth تبقى خارج الكاش.
