/**
 * مُنشئ النسخة المستقلة الشاملة لمنظومة ميزان (Single Standalone HTML Builder)
 * يقوم بدمج كافة الأكواد، التنسيقات، الأيقونات، والحزم البرمجية داخل ملف HTML واحد متكامل
 * يتيح إرسال المنظومة لأي شخص عبر واتساب أو تيليغرام أو فلاش ميموري وتشغيلها بضغطة زر واحدة دون الحاجة لأي ملفات إضافية.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 بدء إنتاج النسخة المستقلة المتكاملة (ميزان.html)...');

// 1. تشغيل خط البناء وفحص الميزانية أولاً
const projectRoot = path.join(__dirname, '..');
execSync('node scripts/build.js', { cwd: projectRoot, stdio: 'inherit' });

// 2. قراءة ملف index.html الأساسي
const indexPath = path.join(projectRoot, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 3. دمج ملف التنسيقات style.css بالكامل داخل <style>
const cssPath = path.join(projectRoot, 'style.css');
if (fs.existsSync(cssPath)) {
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  html = html.replace(
    '<link rel="stylesheet" href="style.css">',
    `<style>\n/* --- Inline Mizan Styles --- */\n${cssContent}\n</style>`
  );
  console.log('  ✅ تم دمج التنسيقات style.css داخل الملف بنجاح.');
}

// 4. تحويل الأيقونة icon.png إلى Base64 مدمج لتعمل الأيقونة والشعار على أي جهاز بشكل مستقل
const iconPath = path.join(projectRoot, 'icon.png');
if (fs.existsSync(iconPath)) {
  const iconBase64 = fs.readFileSync(iconPath).toString('base64');
  const iconDataUri = `data:image/png;base64,${iconBase64}`;
  html = html.replace(/src="icon\.png"/g, `src="${iconDataUri}"`);
  html = html.replace(/href="icon\.png"/g, `href="${iconDataUri}"`);
  console.log('  ✅ تم تحويل وتضمين أيقونة وشعار المنظومة كـ Base64 مدمج.');
}

// 5. استبدال استدعاءات الوحدات البرمجية بالحزمة المجمعة dist/bundle.js
const bundlePath = path.join(projectRoot, 'dist', 'bundle.js');
if (fs.existsSync(bundlePath)) {
  const bundleContent = fs.readFileSync(bundlePath, 'utf8');

  // إزالة وسوم السكربتات الفردية
  const scriptRegex = /<script src="(modules\/[^"]+|js\/app\.js)"><\/script>\r?\n?/g;
  html = html.replace(scriptRegex, '');

  // إضافة السكربت المجمع قبل إغلاق </body>
  html = html.replace('</body>', `<script>\n/* --- Mizan Application Bundle --- */\n${bundleContent}\n</script>\n</body>`);
  console.log('  ✅ تم دمج كافة محركات ووحدات المنظومة داخل وسم script واحد موحد.');
} else {
  console.error('❌ خطأ: لم يتم العثور على الحزمة dist/bundle.js');
  process.exit(1);
}

// 6. حفظ الملف المستقل النهائي
const outName = 'ميزان.html';
const outPath = path.join(projectRoot, outName);
fs.writeFileSync(outPath, html, 'utf8');

const stat = fs.statSync(outPath);
const sizeKb = (stat.size / 1024).toFixed(1);
const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);

console.log('====================================================');
console.log(`🎉 تم إنشاء الملف المستقل بنجاح: ${outName}`);
console.log(`📁 المسار: ${outPath}`);
console.log(`⚖️ الحجم: ${sizeKb} كيلوبايت (${sizeMb} ميجابايت)`);
console.log('💡 يمكنك الآن إرسال هذا الملف مباشرة لأي شخص لفتحه بضغطة زر واحدة!');
console.log('====================================================');
