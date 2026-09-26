/**
 * حارس الميزانية المعمارية الصارم (Strict Architecture Budget Enforcer)
 * يقوم بالتحقق من أطوال كافة الملفات لضمان عدم حدوث تضخم معماري وخفض استهلاك التوكن
 */

const fs = require('fs');
const path = require('path');

const BUDGET_RULES = {
  mainFile: {
    path: path.join(__dirname, '..', 'js', 'app.js'),
    maxLines: 100
  },
  modulesDir: {
    path: path.join(__dirname, '..', 'modules'),
    maxLines: 600,
    warnLines: 450
  }
};

let hasErrors = false;
let hasWarnings = false;

console.log('====================================================');
console.log('   🔍 بدء فحص ميزانية الأسطر المعمارية وحراسة الكود  ');
console.log('====================================================');

// 1. فحص الملف الرئيسي app.js
if (fs.existsSync(BUDGET_RULES.mainFile.path)) {
  const content = fs.readFileSync(BUDGET_RULES.mainFile.path, 'utf8');
  const lineCount = content.split('\n').length;
  const status = lineCount <= BUDGET_RULES.mainFile.maxLines ? '✅ نجاح' : '❌ فشل صارم';

  console.log(`الملف الرئيسي (app.js): ${lineCount} سطر / الحد الأقصى: ${BUDGET_RULES.mainFile.maxLines} سطر [${status}]`);

  if (lineCount > BUDGET_RULES.mainFile.maxLines) {
    console.error(`🚨 خطأ معماري: تجاوز الملف الرئيسي app.js الحد الأقصى المسموح (${BUDGET_RULES.mainFile.maxLines} سطر).`);
    hasErrors = true;
  }
} else {
  console.error('❌ خطأ: لم يتم العثور على الملف الرئيسي app.js');
  hasErrors = true;
}

// 2. فحص الوحدات النمطية الميكروية في modules/
if (fs.existsSync(BUDGET_RULES.modulesDir.path)) {
  const files = fs.readdirSync(BUDGET_RULES.modulesDir.path).filter(f => f.endsWith('.js'));
  console.log(`\nفحص الوحدات النمطية المصغرة (${files.length} وحدات):`);

  files.forEach(file => {
    const fullPath = path.join(BUDGET_RULES.modulesDir.path, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lineCount = content.split('\n').length;

    let badge = '✅';
    if (lineCount > BUDGET_RULES.modulesDir.maxLines) {
      badge = '❌ تجاوز صارم';
      hasErrors = true;
      console.error(`  ${badge} ${file.padEnd(25)}: ${lineCount} سطر (الحد الأقصى: ${BUDGET_RULES.modulesDir.maxLines})`);
    } else if (lineCount > BUDGET_RULES.modulesDir.warnLines) {
      badge = '⚠️ تحذير مبكر';
      hasWarnings = true;
      console.warn(`  ${badge} ${file.padEnd(25)}: ${lineCount} سطر (تجاوز عتبة التحذير: ${BUDGET_RULES.modulesDir.warnLines})`);
    } else {
      console.log(`  ${badge} ${file.padEnd(25)}: ${lineCount} سطر`);
    }
  });
} else {
  console.error('❌ خطأ: لم يتم العثور على مجلد الوحدات modules/');
  hasErrors = true;
}

console.log('====================================================');

if (hasErrors) {
  console.error('❌ فشل فحص الميزانية! تم حظر العملية بسبب تضخم الملفات البرمجية.');
  console.error('يرجى تفكيك المنطق إلى وحدات ميكروية أصغر لتوفير التوكن والامتثال للمعمارية.');
  process.exit(1);
} else {
  if (hasWarnings) {
    console.warn('⚠️ تم اجتياز الفحص مع وجود تنبيهات لملفات تقترب من الحد الأقصى.');
  } else {
    console.log('🎉 ممتاز! كافة الملفات مطابقة تماماً للميزانية المعمارية ومعايير خفض التوكن.');
  }
  process.exit(0);
}
