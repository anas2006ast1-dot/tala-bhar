# خطة تقليل حركة صور المنيو

هذا الفرع مبني على تحسينات `fix/menu-image-egress` ويضيف R2 مع Supabase Auth/RLS المقترح. لا توجد تغييرات على الخدمات الحية، ولا ترحيل تلقائي. لا تستخدم صفحة الدخول كلمة مرور ثابتة؛ تسجّل عبر Supabase Auth ويتطلب الحساب `app_metadata.role = admin`.

## سبب الاستهلاك

Cached Egress في Supabase ناتج عن بايتات خرجت عبر CDN عند إصابة الكاش، وليس دليلًا أن الزوار حمّلوا الملفات مرة واحدة فقط. كل تنزيل من جهاز جديد، أو متصفح خاص، أو إعادة طلب من bot/link preview/crawler قد يزيد العدد حتى لو كانت نسخة CDN جاهزة. الـService Worker يخفض إعادة التنزيل داخل المتصفح نفسه فقط؛ ولا يخفض طلبات جهاز جديد. خطة Supabase Free الموثقة حاليًا تتضمن 5GB Cached و5GB Uncached شهريًا. الرقم الذي أرسلته، 5.819GB cached و0.101GB uncached، يتجاوز حد cached بنحو 0.819GB. [حدود Supabase Free وشرح Cached Egress](https://supabase.com/docs/guides/storage/serving/bandwidth)، [كيفية احتساب egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress).

لم أتمكن من قراءة سجلات مشروعك من هذه البيئة، لذلك لا أستطيع تأكيد أن الصور وحدها سببت 5.819GB، أو تمييز الزيارات البشرية عن الزواحف. شغّل `supabase/proposals/image-egress-diagnostics.sql` في SQL Explorer مع تحديد فترة الفاتورة. يجمع المسار وحالة CDN والحجم التقريبي وعنوان IP وUser-Agent؛ راجع تكرار المسارات والـUser-Agent ومصادر الطلبات قبل استنتاج مصدر الحركة. سجلات CDN تساعد في تحديد الملفات الأكثر طلبًا، لكن User-Agent ليس إثباتًا موثوقًا لهوية bot. [دليل Supabase لحركة التخزين حسب الملف](https://supabase.com/docs/guides/storage/serving/bandwidth)، [حقول السجلات](https://supabase.com/docs/guides/observability/log-field-reference).

## ما يفعله الفرع

- خدمة الصور العامة من bucket في Cloudflare R2 عبر custom domain، مع بقاء بيانات المنيو والأسعار الأصلية في Supabase. لا تستخدم الصور رابط `r2.dev` المحدود للتجربة.
- التصفح العام يقرأ لقطة JSON منشورة إلى R2/Worker بدل عمل ثلاث قراءات مباشرة من Supabase في كل جهاز. يُحدّث الأدمن اللقطة بعد جلب البيانات الطازجة من Supabase. لذلك يستطيع جهاز جديد قراءة آخر لقطة حتى لو كان Supabase متوقفًا مؤقتًا بسبب الحصة. إذا كانت اللقطة غير مزروعة بعد، لا يستطيع الجهاز الجديد استرجاعها من IndexedDB؛ يجب تنفيذ خطوة seed قبل تحويل الواجهة.
- صور R2 تستخدم مسارات فريدة و`Cache-Control: public, max-age=31536000, immutable`. رفع صورة معدّلة ينشئ رابطًا جديدًا. تبقى الروابط الأصلية في Supabase صالحة ولا يحذفها هذا الفرع.
- لوحة الأدمن تستخدم Supabase Auth، وسياسات SQL المقترحة تقصر تعديل البيانات والرفع القديم إلى مسؤول يحمل `app_metadata.role = admin`. يتحقق Worker من access token مع Auth API قبل قبول رفع R2 أو تحديث لقطة المنيو؛ لا يوجد Worker password أو R2 secret أو service-role key في المتصفح. رفع الصورة يمر عبر Worker مع حد 20MB وفحص ترويسة الملف؛ التطبيق يضغط الصور الجديدة إلى WebP قبل الإرسال.
- سكربت ترحيل الصور افتراضيًا يعرض عدد الروابط فقط. `--apply` ينسخ كل صورة ويؤكد أن رابط R2 يعمل، ثم يحدّث `image_url` للصف المعني. يحفظ manifest قبل تحديث DB، ويدعم `--rollback` لاستعادة الروابط القديمة. لا يحذف صور R2 أو Supabase.

## صلاحيات الأدمن والانتقال الآمن

لم تعد جلسة Worker المنفصلة موجودة. الواجهة تسجّل دخول المسؤول في Supabase Auth، وطلبات قاعدة البيانات تحمل access token تلقائيًا حتى تطبق RLS المقترحة. Worker يتحقق من الـtoken بالرجوع إلى Supabase Auth ويقبل فقط حسابًا يحمل الدور الخادمي `app_metadata.role = admin`. المستخدم العادي المسجل لا يقدر على الكتابة أو رفع الصور. لا تستخدم `user_metadata` لتحديد الدور.

ملف `supabase/proposals/admin-auth-rls-preflight.sql` يراجع السياسات الحية قبل التغيير، و`admin-auth-rls.sql` مسودة سياسات للمراجعة فقط. جهّز حساب المسؤول وامنحه الدور من shell موثوق عبر `scripts/set-admin-role.mjs` بعد موافقتك. إعداد Admin Auth/RLS والتأكد من نجاح الدخول والكتابة يجب أن يسبق نشر هذا الفرع. لا تشغّل SQL هنا تلقائيًا. فرع `fix/menu-image-egress` يظل منفصلًا ويحافظ على دخول النسخة الحالية لحين مراجعة انتقال Auth.

## الحصة والتكلفة المتوقعة

Cloudflare R2 Standard يتضمن حاليًا 10GB-month تخزين و1M Class A و10M Class B شهريًا، وegress إلى الإنترنت مجاني. على فرض أن رقم Storage الحالي 0.013GB هو كامل أرشيف المنيو، فالحجم الفعلي المنقول يقارب 13MB. بسبب تقريب وحدات التخزين إلى أعلى، قد يُحسب كـ1GB-month، ويبقى نحو 9GB-month من الحصة قبل استخدامات الحساب الأخرى. عدد الـGETs الفعلي غير متاح؛ يجب قياسه من سجلات Supabase قبل النقل ومراقبة Class B بعده. تخزين الصور وحده لا يضمن البقاء ضمن المجاني إن كان هناك استخدام آخر للحساب أو تجاوز للحصص. [أسعار وحدود R2](https://developers.cloudflare.com/r2/pricing/).

بدائل مجانية: ImageKit يدرج 3GB DAM و20GB bandwidth شهريًا، لكنه يوقف delivery عند بلوغ حدّ الشهر، ما قد يسبب اختفاء الصور إلى أن تتجدد الحصة. Backblaze B2 يقدم أول 10GB تخزين مجانًا وegress مجاني حتى 3× متوسط التخزين الشهري؛ إذا كانت الصور 13MB فقط فحد الخروج الأساسي نحو 39MB، أو يمر التوزيع عبر CDN شريك وفق شروطه. Cloudinary يعلن 25 credits بالشهر في المجاني، لكن الاستهلاك يجمع أكثر من مورد ويحتاج قياسًا؛ لهذا الطلب الذي يهيمن عليه تنزيل الصور، R2 أو ImageKit أسهل في توقع الحد. لا يوجد خيار مجاني يضمن بقاء الخدمة عند تجاوز حدّها. [ImageKit Free](https://imagekit.io/plans)، [Backblaze B2](https://www.backblaze.com/cloud-storage/pricing)، [Cloudinary Free](https://cloudinary.com/pricing).

إذا كانت كل 5.819GB cached egress صورًا من القائمة، فقد تنتقل معظم هذه الحركة مستقبلًا من Supabase إلى Cloudflare/R2؛ هذا تقدير مشروط وليس قياسًا. إن كشفت السجلات أن جزءًا فقط صور `menu-images`، فالمتوقع توفير ذلك الجزء فقط. طلبات REST/Reatime/Auth وغيرها تبقى على Supabase لكن سجل قاعدة البيانات يظل صغيرًا.

لازم نطاق تملكه وتضيفه إلى Cloudflare لتعيين `images.<your-domain>` كـR2 custom domain. إعداد DNS لا يحتاج خدمة مدفوعة بحد ذاته؛ تسجيل النطاق أو تجديده قد يكلف سنويًا حسب TLD والمُسجّل. Cloudflare Registrar يبيع بسعر registry/ICANN دون markup. [ربط النطاق بـR2](https://developers.cloudflare.com/r2/buckets/public-buckets/)، [سعر تسجيل النطاق](https://developers.cloudflare.com/registrar/faq/). إذا لم يكن لديك نطاق، لا تستخدم `r2.dev` للإنتاج.

يستخدم Worker المجاني حاليًا حدًا يبلغ 100,000 request يوميًا، وRate Limit binding تقريبيًا لكل موقع Cloudflare. إعدادات المشروع تحدد حدًا تقريبيًا لتسجيل الدخول والرفع. ملفات الصور لا تمر عبر Worker للتنزيل، بل من custom domain إلى R2. [Workers Free limits](https://developers.cloudflare.com/workers/platform/limits/)، [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

## إعداد يلزم بعد موافقتك

1. اختر نطاقًا موجودًا، وحدد `images.<domain>` للصور، واسم Worker API. أضف zone إلى حساب Cloudflare إذا لم تكن مضافة.
2. أنشئ R2 bucket باسم `tala-bahr-menu-images` واربطه بالنطاق `images.<domain>`. اجعل القراءة عامة للصور؛ المفتاح لا يصبح عامًا. أوقف `r2.dev` بعد الاختبار. أضف Cache Rule لـ`/items/*` مع احترام Cache-Control، وأضف CORS لواجهة المنيو تسمح بـ`GET` و`HEAD` عند طلب JSON. لا تسمح للواجهة بالكتابة مباشرة إلى bucket.
3. حدّث `PUBLIC_IMAGE_BASE_URL`, `APP_ORIGINS`, `SUPABASE_URL`, و`SUPABASE_ANON_KEY` في `wrangler.toml`. المفتاح العام ليس سرًا، وRLS تمنح الصلاحية؛ لا تضف `service_role` أو R2 secret إلى Worker vars أو الواجهة. لا يوجد Worker password أو session secret.
4. نفّذ `wrangler deploy` يدويًا بعد الموافقة. لا يستخدم الكود الحالي أي R2 keys لأن R2 binding يتولى الكتابة داخل Worker.
5. اضبط `VITE_MEDIA_API_URL` و`VITE_R2_PUBLIC_URL` في Preview. أول طلب من Worker يزرع لقطة عامة من Supabase إلى R2 إذا لم تكن موجودة. اختبر دخول المسؤول عبر Supabase Auth، وأضف/عدّل طبقًا وسعرًا وتوفّرًا وصورة، وتأكد أن المستخدم العادي يُرفض.
6. شغّل `node scripts/migrate-menu-images.mjs` أولًا دون `--apply` لمعاينة الروابط. بعد موافقة منفصلة وتجهيز R2/Preview، شغّله بـ`--apply` من shell محلي موثوق مع `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, و`R2_PUBLIC_BASE_URL`. المفتاح الإداري يبقى في shell المحلي ولا يذهب إلى المتصفح أو GitHub أو Vercel. يحفظ السكربت manifest قبل تحديث كل صف ويتحقق من الصورة قبل التحديث. افحص manifest والصور من جهاز جديد. لا يحذف أي ملف من Supabase.
7. انشر الواجهة بعد ذلك إلى Preview أولًا. جرّب فتح المنيو على هاتف/متصفح جديد، إعادة فتحه، تعديل سعر وتوفر وصورة من الأدمن، ثم تحقق أن Realtime يحدّث البيانات وأن Cache-First يعمل offline. الترقية للإنتاج تحتاج موافقة منفصلة؛ rollback يعيد `image_url` من manifest ويبقي الصور الأصلية.

## ملاحظات تشغيل

- تكامل Cloudflare Worker/R2 وSupabase Auth/RLS غير مربوط بعد؛ بدون إعداد الخدمات وتنفيذ SQL بموافقتك، لن يعمل دخول الأدمن على هذا الفرع. فرع تحسين الاستهلاك المنفصل يحافظ على آلية الدخول الحالية.
- يجب تشغيل نشر/تحديث لقطة المنيو بعد تعديل الأصناف/الأسعار. الكود ينشرها بعد تعديل ناجح من اللوحة أو بعد حدث Realtime، ولا يعيد كتابتها لمجرد فتح لوحة الأدمن. يصل تحديثها إلى نقاط Cloudflare edge الأخرى بعد انتهاء مدة التخزين المؤقت، 15 ثانية كحد أقصى تقريبي.
- صفحة المنيو تبقى static على Vercel في هذا الفرع. شروط Vercel Hobby الحالية تقصر الخطة على الاستخدام الشخصي غير التجاري؛ لأن هذا منيو مطعم، تحقق من نوع الخطة وشروطها قبل أي نشر. لم أغير الاستضافة أو الحساب. [شروط Vercel Hobby](https://vercel.com/docs/limits/fair-use-guidelines).
