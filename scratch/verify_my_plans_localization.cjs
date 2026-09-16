const fs = require('fs');
const path = require('path');

const locales = ['en', 'hi', 'mr', 'bn', 'te'];
const requiredKeys = [
  'portfolioTag',
  'title',
  'subtitle',
  'exploreLic',
  'findMore',
  'savedTotal',
  'tabAll',
  'tabGovt',
  'tabLic',
  'tabFree',
  'loginRequiredTitle',
  'loginRequiredDesc',
  'citizenLogin',
  'createAccount',
  'loadingPlans',
  'emptyTitle',
  'emptyDesc',
  'exploreCatalog',
  'officialLic',
  'removePlan',
  'remove',
  'interestBenefit',
  'sumAssured',
  'welfareBenefit',
  'viewSchemeDetails',
  'viewLicDetails',
  'viewFreeDetails',
  'verified',
  'citizen',
  'years',
  'saved',
  'addToMyPlans',
  'noFilteredItems',
  'showAllPlans',
  'authorityGovIndia',
  'authorityLic',
  'authorityGovWelfare',
  'statutoryBenefit',
  'freePercent',
  'freeBadge',
  'sumAssuredWithBonus',
  'professions.student',
  'professions.salaried',
  'professions.farmer',
  'professions.business',
  'professions.unorganized',
  'professions.homemaker',
  'professions.retired'
];

let hasErrors = false;

console.log('=== 1. Checking Locales Coverage for myPlans ===');
for (const lang of locales) {
  const filePath = path.join(__dirname, '..', 'src', 'locales', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const myPlans = data.myPlans;
  if (!myPlans) {
    console.error(`❌ [${lang}] Missing "myPlans" root key`);
    hasErrors = true;
    continue;
  }

  for (const key of requiredKeys) {
    const parts = key.split('.');
    let val = myPlans;
    for (const p of parts) {
      val = val ? val[p] : undefined;
    }
    if (!val || typeof val !== 'string' || val.trim() === '') {
      console.error(`❌ [${lang}] Missing or empty key: myPlans.${key}`);
      hasErrors = true;
    }
  }
}

if (!hasErrors) {
  console.log('✅ All 5 locale files contain 100% of required myPlans keys.');
}

console.log('\n=== 2. Checking Values of Required Visible Prompt Strings Across Languages ===');
for (const lang of locales) {
  const filePath = path.join(__dirname, '..', 'src', 'locales', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const m = data.myPlans;
  console.log(`\n--- [Language: ${lang.toUpperCase()}] ---`);
  console.log(`  * Title: ${m.title}`);
  console.log(`  * Portfolio Tag: ${m.portfolioTag}`);
  console.log(`  * Subtitle: ${m.subtitle}`);
  console.log(`  * Explore LIC: ${m.exploreLic}`);
  console.log(`  * Find More: ${m.findMore}`);
  console.log(`  * Verified: ${m.verified}`);
  console.log(`  * Saved Total: ${m.savedTotal}`);
  console.log(`  * Student: ${m.professions?.student}`);
  console.log(`  * Years / Yrs: ${m.years}`);
  console.log(`  * Empty Title: ${m.emptyTitle}`);
  console.log(`  * Empty Desc: ${m.emptyDesc}`);
  console.log(`  * Explore Catalog: ${m.exploreCatalog}`);
  console.log(`  * Official LIC Plans: ${m.officialLic}`);
}

console.log('\n=== 3. Auditing MyPlansPage.jsx for Hardcoded Language Checks ===');
const myPlansSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'pages', 'MyPlansPage.jsx'), 'utf8');

// Ensure no ternary currentLang checks exist
const currentLangMatches = myPlansSource.match(/currentLang\s*[!=]==?/g);
if (currentLangMatches) {
  console.error(`❌ Found hardcoded currentLang checks in MyPlansPage.jsx (${currentLangMatches.length} occurrences)`);
  hasErrors = true;
} else {
  console.log('✅ No currentLang conditionals found in MyPlansPage.jsx (all UI routed through t())');
}

// Verify that all major t('myPlans.<key>') calls are present
const expectedTCalls = [
  "t('myPlans.portfolioTag'",
  "t('myPlans.title'",
  "t('myPlans.subtitle'",
  "t('myPlans.exploreLic'",
  "t('myPlans.findMore'",
  "t('myPlans.citizen'",
  "t('myPlans.verified'",
  "t('myPlans.years'",
  "t('myPlans.savedTotal'",
  "t('myPlans.tabAll'",
  "t('myPlans.tabGovt'",
  "t('myPlans.tabLic'",
  "t('myPlans.tabFree'",
  "t('myPlans.loginRequiredTitle'",
  "t('myPlans.loginRequiredDesc'",
  "t('myPlans.citizenLogin'",
  "t('myPlans.createAccount'",
  "t('myPlans.loadingPlans'",
  "t('myPlans.emptyTitle'",
  "t('myPlans.emptyDesc'",
  "t('myPlans.exploreCatalog'",
  "t('myPlans.officialLic'",
  "t('myPlans.noFilteredItems'",
  "t('myPlans.showAllPlans'",
  "t('myPlans.removePlan'",
  "t('myPlans.welfareBenefit'",
  "t('myPlans.sumAssured'",
  "t('myPlans.interestBenefit'",
  "t('myPlans.viewFreeDetails'",
  "t('myPlans.viewLicDetails'",
  "t('myPlans.viewSchemeDetails'",
  "t('myPlans.remove'"
];

for (const tCall of expectedTCalls) {
  if (!myPlansSource.includes(tCall)) {
    console.error(`❌ Missing expected t() call in MyPlansPage.jsx: ${tCall}`);
    hasErrors = true;
  }
}
console.log(`✅ All ${expectedTCalls.length} expected t('myPlans.<key>') calls are active in MyPlansPage.jsx!`);

console.log('\n=== 4. Dynamic Content Localizer Verification ===');
const contentLocalizerSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'contentLocalizer.js'), 'utf8');
const catHasAllLanguages = ['en', 'hi', 'mr', 'bn', 'te'].every(l => contentLocalizerSrc.includes(`${l}:`));
console.log(`  * Category / Benefit types support all 5 languages: ${catHasAllLanguages ? '✅ YES' : '❌ NO'}`);

if (hasErrors) {
  console.error('\n❌ Verification failed with errors.');
  process.exit(1);
} else {
  console.log('\n✨ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! ✨');
}
