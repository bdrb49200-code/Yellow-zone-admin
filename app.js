const SUPABASE_URL='https://wmqjlbrgdjgfjwopekup.supabase.co';
const CUSTOMER_SITE='https://bdrb49200-code.github.io/Yellow-zone/';
const SUPABASE_KEY='sb_publishable_N3BSrFZfEidi-nN8hYbWFg_WbjMMsDn';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const perms={full:['stats','bookings','offers','ads','gallery','reviews'],pricing_ads:['offers','ads','gallery','reviews']};
let current=null;
const $=id=>document.getElementById(id);
async function getToken(){const {data}=await sb.auth.getSession();return data.session?.access_token||''}
async function api(path,opts={}){const token=await getToken();const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{...opts,headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation',...(opts.headers||{})}});if(!r.ok)throw new Error(await r.text());return r.status===204?null:r.json()}
async function rpc(name,args={}){const token=await getToken();if(!token)throw new Error('not_authenticated');const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args)});if(!r.ok)throw new Error(await r.text());return r.json()}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function mediaUrl(v=''){const x=String(v||'');return /^https?:\/\//i.test(x)||/^data:/i.test(x)||x.startsWith('blob:')?x:(x?CUSTOMER_SITE+x.replace(/^\.\//,''):'')}
function applyPermissions(){document.querySelectorAll('[data-perm]').forEach(el=>{const p=el.dataset.perm;el.classList.toggle('hidden',!perms[current.role]?.includes(p))})}
async function finishLogin(){
 const profile=await rpc('yz_admin_profile');
 current={email:current.email,role:profile?.role,label:profile?.display_name||current.email};
 if(!perms[current.role])throw new Error('forbidden');
 sessionStorage.setItem('yz_admin_auth','1');
 $('loginView').classList.add('hidden');$('app').classList.remove('hidden');$('userName').textContent=current.label;$('welcomeName').textContent=current.label;$('userRole').textContent=current.role==='full'?'أدمن كامل':'إدارة الأسعار والإعلانات';applyPermissions();showPage('dashboard');loadAll();
}
const loginUsers={
 eman:'eme208120@gmail.com',
 ايمان:'eme208120@gmail.com',
 إيمان:'eme208120@gmail.com',
 alaa:'jdhxjsjdidbdkdbk@gmail.com',
 الاء:'jdhxjsjdidbdkdbk@gmail.com',
 آلاء:'jdhxjsjdidbdkdbk@gmail.com'
};
async function login(){
 const username=$('username').value.trim().toLowerCase(),password=$('password').value;
 const email=loginUsers[username];
 $('loginMsg').textContent='جارٍ تسجيل الدخول...';
 if(!email){$('loginMsg').textContent='اسم المستخدم أو كلمة المرور غير صحيحة';return}
 const {error}=await sb.auth.signInWithPassword({email,password});
 if(error){$('loginMsg').textContent='اسم المستخدم أو كلمة المرور غير صحيحة';return}
 current={email};
 try{await finishLogin();$('loginMsg').textContent=''}catch(e){await sb.auth.signOut();current=null;$('loginMsg').textContent='هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة'}
}
async function logout(){await sb.auth.signOut();sessionStorage.removeItem('yz_admin_auth');current=null;location.reload()}
function showPage(id){const el=$(id);if(!el||!current)return;if(el.dataset.perm&&!perms[current.role]?.includes(el.dataset.perm))return;document.querySelectorAll('.page').forEach(x=>x.classList.add('hidden'));el.classList.remove('hidden');$('pageTitle').textContent={dashboard:'الرئيسية',bookings:'الحجوزات',offers:'الأسعار والباقات',ads:'الإعلانات والفعاليات',gallery:'المعرض',reviews:'التقييمات والتعليقات'}[id]||'Yellow Zone';if(id==='bookings')loadBookings();if(id==='offers')loadOffers();if(id==='ads')loadAds();if(id==='gallery')loadGallery();if(id==='reviews')loadReviews()}

async function loadDashboard(){
  if(current.role!=='full')return;
  try{const b=await rpc('yz_admin_bookings',{});const arr=Array.isArray(b)?b:[];$('totalBookings').textContent=arr.length;$('newBookings').textContent=arr.filter(x=>x.status==='new').length;$('confirmedBookings').textContent=arr.filter(x=>x.status==='confirmed').length;$('birthdayBookings').textContent=arr.filter(x=>(x.service_type||'').toLowerCase().includes('birthday')||(x.service_type||'').includes('عيد')).length;$('recentBookings').innerHTML=arr.slice(0,8).map(x=>`<div class="row"><div><b>${esc(x.customer_name||'بدون اسم')}</b><small>${esc(x.booking_date||'')} · ${x.guests||0} أشخاص</small></div><span class="tag">${esc(x.status||'new')}</span></div>`).join('')||'<div class="empty">لا توجد حجوزات حتى الآن</div>'}catch(e){$('recentBookings').innerHTML='<div class="error">تعذر تحميل الحجوزات</div>'}
}
async function loadBookings(){try{const b=await rpc('yz_admin_bookings',{});const arr=Array.isArray(b)?b:[];$('bookingsList').innerHTML=arr.map(x=>`<div class="booking"><div class="booking-top"><div><b>${esc(x.customer_name||'بدون اسم')}</b><small>${esc(x.booking_code||'')}</small></div><div class="booking-actions"><select onchange="setStatus(${x.id},this.value)"><option value="new" ${x.status==='new'?'selected':''}>جديد</option><option value="confirmed" ${x.status==='confirmed'?'selected':''}>مؤكد</option></select><button class="cancel-booking" onclick="cancelBooking(${x.id})" ${x.status==='cancelled'?'disabled':''}>إلغاء الحجز وحذفه من الموقع</button></div></div><div class="booking-grid"><span>الهاتف<br><b>${esc(x.customer_phone||'-')}</b></span><span>التاريخ<br><b>${esc(x.booking_date||'-')}</b></span><span>العدد<br><b>${x.guests||0}</b></span><span>الخدمة<br><b>${esc(x.service_type||'-')}</b></span></div>${x.edit_count>0?`<div class="edited-badge">تم تعديل الحجز ${x.edit_count} ${x.edit_count===1?'مرة':'مرات'} · تاريخ إنشاء الطلب محفوظ</div>`:''}${x.notes?`<div class="notes">${esc(x.notes)}</div>`:''}</div>`).join('')||'<div class="empty">لا توجد حجوزات</div>'}catch(e){$('bookingsList').innerHTML='<div class="error">تعذر تحميل الحجوزات</div>'}}
async function setStatus(id,status){try{await rpc('yz_admin_booking_status',{...{},p_id:id,p_status:status});await loadBookings();await loadDashboard()}catch(e){alert('تعذر تحديث حالة الحجز')}}
async function cancelBooking(id){if(!confirm('هل أنت متأكد من إلغاء هذا الحجز؟'))return;try{await rpc('yz_admin_booking_status',{...{},p_id:id,p_status:'cancelled'});await loadBookings();await loadDashboard()}catch(e){alert('تعذر إلغاء الحجز وحذفه من الموقع')}}

async function loadOffers(){
 try{
  const o=await api('offers?select=id,name_ar,name_en,description_ar,description_en,price,active,booking_enabled,category,sort_order&order=sort_order.asc,id.asc');
  $('offersList').innerHTML=o.map(x=>`<div class="offer-row"><div><b>${esc(x.name_ar||x.name_en||'بدون اسم')}</b><small>${esc(x.description_ar||'')}</small></div><div class="offer-right"><strong>${x.price??0} ريال</strong><span class="${x.active?'active':'inactive'}">${x.active?'ظاهر':'مخفي'}</span><span class="${x.booking_enabled!==false?'active':'inactive'}">${x.booking_enabled!==false?'الحجز متاح':'بدون حجز'}</span><button onclick="editOffer(${x.id})">تعديل</button><button class="danger" onclick="deleteOffer(${x.id})">حذف</button></div></div>`).join('')||'<div class="empty">لا توجد باقات</div>'
 }catch(e){$('offersList').innerHTML='<div class="error">تعذر تحميل الأسعار</div>'}
}
async function editOffer(id){
 try{
  const a=await api('offers?id=eq.'+id);const x=a[0];if(!x)return;
  $('offerId').value=x.id;$('offerNameAr').value=x.name_ar||x.name_en||'';$('offerDescAr').value=x.description_ar||x.description_en||'';$('offerCategory').value=x.category||'general';$('offerSort').value=x.sort_order??0;$('offerPrice').value=x.price??0;$('offerActive').checked=!!x.active;$('offerBookingEnabled').checked=x.booking_enabled!==false;$('offerEditor').classList.remove('hidden');$('offerMsg').textContent=''
 }catch(e){alert('تعذر فتح الباقة')}
}
async function deleteOffer(id){
 if(!confirm('حذف هذه الباقة نهائيًا؟'))return;
 try{await rpc('yz_admin_offer_delete',{...{},p_id:Number(id)});await loadOffers()}
 catch(e){alert('تعذر حذف الباقة: '+e.message)}
}
async function saveOffer(){
 const id=$('offerId').value;
 const nameAr=$('offerNameAr').value.trim(),descAr=$('offerDescAr').value.trim(); const body={...{},p_id:Number(id),p_name_ar:nameAr,p_name_en:nameAr,p_description_ar:descAr,p_description_en:descAr,p_price:Number($('offerPrice').value)||0,p_active:$('offerActive').checked,p_category:$('offerCategory').value,p_sort_order:Number($('offerSort').value)||0,p_booking_enabled:$('offerBookingEnabled').checked};
 if(!body.p_name_ar){$('offerMsg').textContent='اكتب اسم الباقة';return}
 try{
  if(id){await rpc('yz_admin_offer_update',body)}
  else{await rpc('yz_admin_offer_create',{...{},p_name_ar:body.p_name_ar,p_name_en:body.p_name_en,p_description_ar:body.p_description_ar,p_description_en:body.p_description_en,p_price:body.p_price,p_active:body.p_active,p_category:body.p_category,p_sort_order:body.p_sort_order,p_booking_enabled:body.p_booking_enabled})}
  $('offerEditor').classList.add('hidden');$('offerMsg').textContent='';await loadOffers()
 }catch(e){$('offerMsg').textContent='تعذر الحفظ: '+e.message}
}

async function loadAds(){
 try{
  const a=await api('ads?select=id,title,text,image_url,active,created_at,sort_order,bookable,price,title_ar,title_en,body_ar,body_en,target_url&order=sort_order.asc,created_at.desc');
  $('adsList').innerHTML=a.map(x=>`<div class="ad-row"><div class="ad-info">${x.image_url?`<img src="${esc(mediaUrl(x.image_url))}" alt="">`:''}<div><b>${esc(x.title_ar||x.title||'بدون عنوان')}</b><small>${esc(x.body_ar||x.text||'')}</small></div></div><div class="ad-actions"><strong>${x.price??0} ريال</strong><span class="${x.active?'active':'inactive'}">${x.active?'ظاهر':'مخفي'}</span><span class="${x.bookable?'active':'inactive'}">${x.bookable?'الحجز متاح':'بدون حجز'}</span><button onclick="editAd('${x.id}')">تعديل</button><button class="danger" onclick="deleteAd('${x.id}')">حذف</button></div></div>`).join('')||'<div class="empty">لا توجد إعلانات أو فعاليات</div>'
 }catch(e){$('adsList').innerHTML='<div class="error">تعذر تحميل الإعلانات</div>'}
}
async function editAd(id){
 try{
  const a=await api('ads?id=eq.'+encodeURIComponent(id));const x=a[0];if(!x)return;
  $('adId').value=x.id;$('adTitle').value=x.title_ar||x.title||'';$('adBody').value=x.body_ar||x.text||'';$('adImage').value=x.image_url&&x.image_url.startsWith('http')?x.image_url:'';$('adFile').value='';$('preview').src=mediaUrl(x.image_url||'');$('preview').style.display=x.image_url?'block':'none';$('adActive').checked=!!x.active;$('adBookable').checked=!!x.bookable;$('adPrice').value=x.price??0;$('editorTitle').textContent='تعديل الإعلان أو الفعالية';$('adEditor').classList.remove('hidden');$('adMsg').textContent=''
 }catch(e){alert('تعذر فتح الإعلان')}
}
async function deleteAd(id){if(!confirm('حذف الإعلان أو الفعالية نهائيًا؟'))return;try{await rpc('yz_admin_ad_delete',{...{},p_id:id});await loadAds()}catch(e){alert('تعذر حذف الإعلان: '+e.message)}}
function resizeImage(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const max=1600,scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.78))};img.onerror=reject;img.src=r.result};r.onerror=reject;r.readAsDataURL(file)})}
async function saveAd(){
 const file=$('adFile').files[0];if(file&&file.size>8*1024*1024){$('adMsg').textContent='الصورة كبيرة. اختار صورة أقل من 8MB.';return}
 const body={...{},p_id:$('adId').value||null,p_title:$('adTitle').value.trim(),p_text:$('adBody').value.trim(),p_image_url:$('adImage').value.trim(),p_active:$('adActive').checked,p_bookable:$('adBookable').checked,p_price:Number($('adPrice').value)||0};
 if(!body.p_title){$('adMsg').textContent='اكتب عنوان المحتوى';return}
 try{if(file)body.p_image_url=await resizeImage(file);await rpc('yz_admin_ad_upsert',{...body,p_bookable:body.p_bookable,p_price:body.p_price});$('adEditor').classList.add('hidden');$('adMsg').textContent='';await loadAds()}catch(e){$('adMsg').textContent='تعذر الحفظ: '+e.message}
}
async function loadGallery(){try{const a=await api('gallery?select=id,title_ar,title_en,image_url,active,sort_order,created_at&order=sort_order.asc,created_at.asc');$('galleryList').innerHTML=a.map(x=>`<div class="ad-row"><div class="ad-info">${x.image_url?`<img src="${esc(mediaUrl(x.image_url))}" alt="">`:''}<div><b>${esc(x.title_ar||x.title_en||'بدون عنوان')}</b><small>${esc(x.title_en||'')}</small></div></div><div class="ad-actions"><span class="${x.active?'active':'inactive'}">${x.active?'ظاهر للعملاء':'مخفي'}</span><button onclick="editGallery('${x.id}')">تعديل</button><button class="danger" onclick="deleteGallery('${x.id}')">حذف</button></div></div>`).join('')||'<div class="empty">لا توجد صور</div>'}catch(e){$('galleryList').innerHTML='<div class="error">تعذر تحميل المعرض</div>'}}
async function editGallery(id){try{const a=await api('gallery?id=eq.'+encodeURIComponent(id));const x=a[0];if(!x)return;$('galleryId').value=x.id;$('galleryTitleAr').value=x.title_ar||x.title_en||'';$('galleryImage').value=x.image_url&&x.image_url.startsWith('http')?x.image_url:'';$('galleryFile').value='';$('galleryPreview').src=mediaUrl(x.image_url||'');$('galleryPreview').style.display=x.image_url?'block':'none';$('gallerySort').value=x.sort_order??0;$('galleryActive').checked=!!x.active;$('galleryEditorTitle').textContent='تعديل صورة';$('galleryEditor').classList.remove('hidden');$('galleryMsg').textContent=''}catch(e){alert('تعذر فتح الصورة')}}
async function deleteGallery(id){if(!confirm('حذف الصورة نهائيًا؟'))return;try{await rpc('yz_admin_gallery_delete',{...{},p_id:id});loadGallery()}catch(e){alert('تعذر حذف الصورة')}}
async function saveGallery(){const file=$('galleryFile').files[0];if(file&&file.size>8*1024*1024){$('galleryMsg').textContent='الصورة كبيرة. اختار صورة أقل من 8MB.';return}const body={...{},p_id:$('galleryId').value||null,p_title_ar:$('galleryTitleAr').value.trim(),p_title_en:$('galleryTitleAr').value.trim(),p_image_url:$('galleryImage').value.trim(),p_active:$('galleryActive').checked,p_sort_order:Number($('gallerySort').value)||0};if(!body.p_image_url&&!file){$('galleryMsg').textContent='اختار صورة أو اكتب رابط صورة';return}try{if(file)body.p_image_url=await resizeImage(file);await rpc('yz_admin_gallery_upsert',body);$('galleryEditor').classList.add('hidden');$('galleryMsg').textContent='';await loadGallery()}catch(e){$('galleryMsg').textContent='تعذر الحفظ: '+e.message}}
async function loadReviews(){
 try{
  const arr=await rpc('yz_admin_reviews');
  const list=Array.isArray(arr)?arr:[];
  const avg=list.length?(list.reduce((a,x)=>a+Number(x.rating||0),0)/list.length).toFixed(1):'0.0';
  $('reviewsSummary').innerHTML=`<div class="review-stat"><strong>${avg}</strong><span>متوسط التقييم</span></div><div class="review-stat"><strong>${list.length}</strong><span>إجمالي التعليقات</span></div>`;
  $('reviewsList').innerHTML=list.map(x=>`<div class="review-admin-row"><div><b>${esc(x.first_name)}</b><div class="stars">${'★'.repeat(Number(x.rating||0))}${'☆'.repeat(5-Number(x.rating||0))}</div><p>${esc(x.comment)}</p><small>${new Date(x.created_at).toLocaleString('ar-SA')}</small></div><div class="review-actions"><span class="${x.visible?'active':'inactive'}">${x.visible?'ظاهر للعملاء':'مخفي'}</span><button onclick="setReviewVisibility('${x.id}',${!x.visible})">${x.visible?'إخفاء':'إظهار'}</button><button class="danger" onclick="deleteReview('${x.id}')">حذف</button></div></div>`).join('')||'<div class="empty">لا توجد تقييمات حتى الآن</div>';
 }catch(e){$('reviewsList').innerHTML='<div class="error">تعذر تحميل التقييمات</div>'}
}
async function setReviewVisibility(id,visible){try{await rpc('yz_admin_review_visibility',{p_id:id,p_visible:visible});await loadReviews()}catch(e){alert('تعذر تغيير ظهور التعليق')}}
async function deleteReview(id){if(!confirm('حذف هذا التعليق نهائيًا؟'))return;try{await rpc('yz_admin_review_delete',{p_id:id});await loadReviews()}catch(e){alert('تعذر حذف التعليق')}}
function loadAll(){loadDashboard();loadOffers();loadAds();loadGallery();if(current?.role)loadReviews()}
$('newOffer').addEventListener('click',()=>{$('offerId').value='';$('offerNameAr').value='';$('offerDescAr').value='';$('offerCategory').value='general';$('offerSort').value=0;$('offerPrice').value=0;$('offerActive').checked=true;$('offerBookingEnabled').checked=true;$('offerEditor').querySelector('h3').textContent='إضافة سعر أو باقة جديدة';$('offerEditor').classList.remove('hidden');$('offerMsg').textContent='' });
$('loginForm').addEventListener('submit',e=>{e.preventDefault();login()});$('logout').addEventListener('click',logout);document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));$('refreshAll').addEventListener('click',loadAll);$('refreshBookings').addEventListener('click',loadBookings);$('refreshOffers').addEventListener('click',loadOffers);$('refreshReviews').addEventListener('click',loadReviews);
$('newAd').addEventListener('click',()=>{$('adId').value='';$('adTitle').value='';$('adBody').value='';$('adImage').value='';$('adFile').value='';$('preview').style.display='none';$('preview').src='';$('adActive').checked=true;$('adBookable').checked=false;$('adPrice').value=0;$('editorTitle').textContent='إعلان أو فعالية جديدة';$('adEditor').classList.remove('hidden');$('adMsg').textContent='' });
$('adFile').addEventListener('change',()=>{const f=$('adFile').files[0];if(!f)return;const r=new FileReader();r.onload=e=>{$('preview').src=e.target.result;$('preview').style.display='block'};r.readAsDataURL(f)});
$('cancelAd').addEventListener('click',()=>$('adEditor').classList.add('hidden'));$('saveAd').addEventListener('click',saveAd);$('saveOffer').addEventListener('click',saveOffer);$('cancelOffer').addEventListener('click',()=>$('offerEditor').classList.add('hidden'));$('newGallery').addEventListener('click',()=>{$('galleryId').value='';$('galleryTitleAr').value='';$('galleryImage').value='';$('galleryFile').value='';$('galleryPreview').style.display='none';$('galleryPreview').src='';$('gallerySort').value=0;$('galleryActive').checked=true;$('galleryEditorTitle').textContent='صورة جديدة';$('galleryEditor').classList.remove('hidden');$('galleryMsg').textContent='' });$('galleryFile').addEventListener('change',()=>{const f=$('galleryFile').files[0];if(!f)return;const r=new FileReader();r.onload=e=>{$('galleryPreview').src=e.target.result;$('galleryPreview').style.display='block'};r.readAsDataURL(f)});$('cancelGallery').addEventListener('click',()=>$('galleryEditor').classList.add('hidden'));$('saveGallery').addEventListener('click',saveGallery);
(async()=>{const {data}=await sb.auth.getSession();if(data.session){current={email:data.session.user.email};try{await finishLogin()}catch(e){await sb.auth.signOut();current=null}}})();
