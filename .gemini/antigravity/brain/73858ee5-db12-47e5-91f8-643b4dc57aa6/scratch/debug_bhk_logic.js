const MOCK_PROJECTS = [
  {
    id: "p1",
    name: "Lodha Luxuria",
    unitConfigs: [
      { type: "2BHK" },
      { type: "3BHK" }
    ]
  },
  {
    id: "p2",
    name: "Godrej Infinity",
    unitConfigs: [
      { type: "1BHK" }
    ]
  },
  {
     id: "p3",
     name: "3BHK Special",
     bhk: 3
  },
  {
     id: "p4",
     name: "Mixed",
     unitConfigs: [
       { type: "3.5BHK" }
     ]
  }
];

function extractBHKNum(unitType) {
  const t = unitType.toLowerCase().trim()
  const leadingNum = t.match(/(\d+(?:\.\d+)?)/)
  if (leadingNum) return parseFloat(leadingNum[1])
  if (t.includes('studio') || t.includes('rk')) return 0
  return null
}

function getProjectBHKNums(project) {
  const nums = []
  if (project.bhk !== undefined && project.bhk !== null) {
    const configs = Array.isArray(project.bhk) ? project.bhk : [project.bhk]
    configs.forEach((val) => {
      if (typeof val === 'number') nums.push(val)
      else if (typeof val === 'string') {
        const n = extractBHKNum(val)
        if (n !== null) nums.push(n)
      }
    })
  }
  ;(project.unitConfigs || []).forEach((u) => {
    const n = extractBHKNum(u.type || '')
    if (n !== null) nums.push(n)
  })
  return [...new Set(nums)]
}

function getProjectBHKCategories(project) {
  const nums = getProjectBHKNums(project)
  const cats = new Set()
  nums.forEach(n => {
    if (n === 0 || n < 1) cats.add("Studio")
    else if (n === 1) cats.add("1BHK")
    else if (n === 2) cats.add("2BHK")
    else if (n === 3) cats.add("3BHK")
    else if (n === 4) cats.add("4BHK")
    else if (n > 4) cats.add("4BHK+")
    else {
      const floorN = Math.floor(n)
      if (floorN === 1) cats.add("1BHK")
      else if (floorN === 2) cats.add("2BHK")
      else if (floorN === 3) cats.add("3BHK")
      else if (floorN === 4) cats.add("4BHK")
      else if (n > 4) cats.add("4BHK+")
    }
  })
  return Array.from(cats)
}

MOCK_PROJECTS.forEach(p => {
  console.log(`${p.name}:`, getProjectBHKCategories(p))
})
