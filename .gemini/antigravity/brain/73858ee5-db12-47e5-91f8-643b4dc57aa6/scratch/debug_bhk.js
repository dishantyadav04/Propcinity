
const fs = require('fs');
const projects = JSON.parse(fs.readFileSync('d:/Propiq/public/data/projects.json', 'utf8'));

function extractBHKNum(unitType) {
  const t = unitType.toLowerCase().trim()
  const leadingNum = t.match(/(\d+(?:\.\d+)?)/)
  if (leadingNum) return parseFloat(leadingNum[1])
  if (t.includes('studio') || t.includes('rk')) return 0
  return null
}

function getProjectBHKNums(project) {
  const nums = []
  ;(project.unitConfigs || []).forEach((u) => {
    const n = extractBHKNum(u.type || '')
    if (n !== null) nums.push(n)
  })
  return [...new Set(nums)]
}

function getBHKCategories(project) {
  const nums = getProjectBHKNums(project);
  const cats = [];
  nums.forEach(n => {
    if (n === 0) cats.push("Studio");
    else if (n === 1) cats.push("1BHK");
    else if (n === 2) cats.push("2BHK");
    else if (n === 3) cats.push("3BHK");
    else if (n === 4) cats.push("4BHK");
    else if (n > 4) cats.push("4BHK+");
  });
  return cats;
}

const missing = projects.filter(p => getBHKCategories(p).length === 0);

console.log("Total Projects:", projects.length);
console.log("Missing Projects:", missing.length);
if (missing.length > 0) {
  console.log("Missing project IDs:", missing.map(p => p.id));
  console.log("Missing project unitConfigs:", JSON.stringify(missing[0].unitConfigs, null, 2));
}
