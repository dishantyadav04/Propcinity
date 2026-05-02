
const { MOCK_PROJECTS } = require('./lib/mock-data');

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

const projects = MOCK_PROJECTS;
const missing = projects.filter(p => getBHKCategories(p).length === 0);

console.log("Total Projects:", projects.length);
console.log("Missing Projects Count:", missing.length);
if (missing.length > 0) {
  missing.forEach(p => {
    console.log(`ID: ${p.id}, Name: ${p.name}, Configs: ${p.unitConfigs.map(u => u.type).join(', ')}`);
  });
}
