/**
 * خط الإنتاج والتجميع الآلي (Automated Build Pipeline)
 * يقوم بفحص الميزانية أولاً، ثم دمج ملفات المصدر بالترتيب التراكمي السليم
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 بدء خط الإنتاج والتجميع الآلي...');

// 1. تشغيل حارس الميزانية أولاً
try {
  execSync('node scripts/check_budget.js', { stdio: 'inherit' });
} catch (e) {
  console.error('❌ توقف البناء بسبب فشل حارس الميزانية.');
  process.exit(1);
}

// 2. تجميع الحزمة المستقلة
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const moduleOrder = [
  'coreState.js',
  'subjectsConfig.js',
  'storage.js',
  'auditAndSnapshots.js',
  'controlLock.js',
  'header.js',
  'students.js',
  'grades.js',
  'graceMarks.js',
  'stats.js',
  'rooms.js',
  'reportCards.js',
  'officialDocs.js',
  'analytics.js',
  'excelExport.js',
  'cloudSecurity.js',
  'cloudSync.js',
  'authGate.js'
];

let bundleContent = '/* حزمة النظام الموزعة آلياً - يُمنع التعديل اليدوي المباشر هنا */\n\n';

moduleOrder.forEach(file => {
  const filePath = path.join(__dirname, '..', 'modules', file);
  if (fs.existsSync(filePath)) {
    bundleContent += `/* --- Start of ${file} --- */\n`;
    bundleContent += fs.readFileSync(filePath, 'utf8') + '\n\n';
  } else {
    console.error(`❌ خطأ: لم يتم العثور على الوحدة ${file}`);
    process.exit(1);
  }
});

const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
bundleContent += `/* --- Start of app.js (Orchestrator) --- */\n`;
bundleContent += fs.readFileSync(appJsPath, 'utf8');

const bundleOutPath = path.join(distDir, 'bundle.js');
fs.writeFileSync(bundleOutPath, bundleContent, 'utf8');

console.log(`✅ تم إنتاج الحزمة المجمعة بنجاح في: dist/bundle.js (${bundleContent.split('\n').length} سطر).`);
console.log('✨ اكتمل البناء بنجاح.');
