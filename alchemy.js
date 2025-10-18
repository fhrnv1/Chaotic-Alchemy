// A custom implementation of Java's String.hashCode()
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

// Parse user-provided seed to align with Java/Minecraft behavior
// - If it's an integer-like string (e.g. "-4211660071912228797"), parse as 64-bit BigInt
// - If it's a non-numeric string, use Java String.hashCode() (sign-extended to BigInt)
// - If it's a number, convert via BigInt but this may lose precision if user typed a large number without quotes
function parseJavaSeed(input) {
    if (typeof input === 'bigint') return input;
    if (typeof input === 'number') {
        // Numbers in JS are IEEE-754 doubles; precision may be lost for 64-bit seeds.
        // Prefer string path when possible. Still convert to BigInt if provided as Number.
        return BigInt(Math.trunc(input));
    }
    const s = String(input).trim();
    if (/^[+-]?\d+$/.test(s)) {
        try { return BigInt(s); } catch { /* fallthrough */ }
    }
    // Non-numeric: use Java's String.hashCode() and sign-extend to BigInt
    return BigInt(hashCode(s));
}

// A JavaScript implementation of java.util.Random
class JavaRandom {
    constructor(seed) {
        const parsed = parseJavaSeed(seed);
        this.setSeed(parsed);
    }

    setSeed(seed) {
        this.seed = (seed ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n);
    }

    next(bits) {
        this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & ((1n << 48n) - 1n);
        return Number(this.seed >> (48n - BigInt(bits)));
    }

    nextInt(bound) {
        if (bound <= 0) throw new Error("bound must be positive");

        if ((bound & -bound) === bound) { // i.e., bound is a power of 2
            return Number(BigInt.asIntN(31, (BigInt(bound) * BigInt(this.next(31))) >> 31n));
        }

        let bits, val;
        do {
            bits = this.next(31);
            val = bits % bound;
        } while (bits - val + (bound - 1) < 0);
        return val;
    }
}

function shuffle(array, random) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = random.nextInt(i + 1);
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

// --- Data aligned with startup_scripts/substrates.js ---
// 6 个素材类别 + 1 个催化剂类别
const SUBS_EN = [
    ["andesite", "diorite", "granite", "cobblestone", "basalt", "gabbro"],
    ["red", "orange", "yellow", "green", "blue", "magenta"],
    ["blaze", "slime", "nether", "obsidian", "gunpowder", "prismarine"],
    ["arcane", "apatite", "sulfur", "niter", "certus", "quartz"],
    ["zinc", "copper", "iron", "nickel", "lead", "gold"],
    ["cinnabar", "lapis", "sapphire", "emerald", "ruby", "diamond"]
];

const SUBS_CN = [
    ["安山岩", "闪长岩", "花岗岩", "圆石", "玄武岩", "辉长岩"],
    ["红", "橙", "黄", "绿", "蓝", "洋红"],
    ["烈焰粉", "粘液", "下界疣", "黑曜石粉", "火药", "海晶碎片"],
    ["奥术晶尘", "磷灰石粉", "硫磺粉", "硝石粉", "赛特斯石英粉", "石英粉"],
    ["锌粉", "铜粉", "铁粉", "镍粉", "铅粉", "金粉"],
    ["朱砂", "青金石粉", "蓝宝石粉", "绿宝石粉", "红宝石粉", "钻石粉"]
];

const CATALYST_EN = ["igneous", "herbal", "volatile", "crystal", "metal", "gem"];
const CATALYST_CN = ["火成", "草本", "易挥发", "水晶", "金属", "宝石"];

const substrate_mapping = {};
const all_substrates_list = [];
for (let catIndex = 0; catIndex < 6; catIndex++) {
    for (let index = 0; index < 6; index++) {
        const id = `kubejs:substrate_${SUBS_EN[catIndex][index]}`;
        substrate_mapping[id] = { name: SUBS_CN[catIndex][index], category: catIndex, index: index };
        all_substrates_list.push({ name: SUBS_CN[catIndex][index], id: id });
    }
}
// 特殊项
all_substrates_list.push({ name: "硅", id: "kubejs:substrate_silicon" });
all_substrates_list.push({ name: "银 (特殊)", id: "kubejs:substrate_silver" });


function getSubstrateName(id) {
    const found = all_substrates_list.find(s => s.id === id);
    return found ? found.name : "Unknown";
}

function getSubstrateById(id) {
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            const currentId = `kubejs:substrate_${SUBS_EN[i][j]}`;
            if (currentId === id) {
                return { name: SUBS_CN[i][j], category: i, index: j };
            }
        }
    }
    if (id === "kubejs:substrate_silicon") return { name: "硅" };
    if (id === "kubejs:substrate_silver") return { name: "银 (特殊)" };
    return null;
}


function generateAlchemyData(seed) {
    const random = new JavaRandom(seed);
    const cachedAlchemyData = {};

    const next = () => random.nextInt(6);
    const generateCode = () => [next(), next(), next(), next()];

    for (let cat = 0; cat < 7; cat++) {
        cachedAlchemyData[cat] = {
            code: generateCode(),
            // 0..5 类别的成功产物取催化剂类别对应的 substrate
            result: cat === 6 ? "kubejs:substrate_chaos" : `kubejs:substrate_${CATALYST_EN[cat]}`
        };
    }

    let total = [];
    cachedAlchemyData["chaos_mapping"] = [];
    for (let i = 0; i < 38; i++) {
        total.push(i);
        cachedAlchemyData["chaos_mapping"].push(0);
    }

    shuffle(total, random);

    for (let i = 0; i < 38; i += 2) {
        if (total[i] >= 36 && total[i + 1] >= 36) {
            if (i === 0) {
                let swap = total[i + 2];
                total[i + 2] = total[i + 1];
                total[i + 1] = swap;
            } else {
                let swap = total[i - 1];
                total[i - 1] = total[i];
                total[i] = swap;
            }
        }
    }

    for (let i = 0; i < 38; i += 2) {
        cachedAlchemyData["chaos_mapping"][total[i]] = total[i + 1];
        cachedAlchemyData["chaos_mapping"][total[i + 1]] = total[i];
    }

    return cachedAlchemyData;
}

function toTitle(s){
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function displaySubstrateName(category, subIndex){
    const useEn = window.i18n && i18n.locale === 'en';
    return useEn ? toTitle(SUBS_EN[category][subIndex]) : SUBS_CN[category][subIndex];
}

function displayCatalystName(index){
    return (window.i18n ? i18n.catalystName(index) : CATALYST_CN[index]);
}

function getSubstrateByMappingIndex(index) {
    if (index === 36) return { name: (window.i18n ? i18n.t('silicon') : '硅'), id: "kubejs:substrate_silicon" };
    if (index === 37) return { name: (window.i18n ? i18n.t('silverSpecial') : '银 (特殊)'), id: "kubejs:substrate_silver" };
    const category = Math.floor(index / 6);
    const subIndex = index % 6;
    return { name: displaySubstrateName(category, subIndex), id: `kubejs:substrate_${SUBS_EN[category][subIndex]}` };
}


document.getElementById('generateButton').addEventListener('click', () => {
    const seedInput = document.getElementById('seedInput').value;
    if (!seedInput) {
        alert('请输入世界种子！');
        return;
    }

    // 直接以原始字符串作为种子，避免 JS Number 精度丢失，由 JavaRandom 内部的 parseJavaSeed 负责规范化解析
    const seed = seedInput.trim();
    
    const alchemyData = generateAlchemyData(seed);

    // Display Chaos Transmutation
    const chaosList = document.getElementById('chaos-list');
    chaosList.innerHTML = '';
    const mapped = new Set();
    for (let i = 0; i < 38; i++) {
        if (mapped.has(i)) continue;
        
        const partnerIndex = alchemyData.chaos_mapping[i];
        mapped.add(partnerIndex);

        const item1 = getSubstrateByMappingIndex(i);
        const item2 = getSubstrateByMappingIndex(partnerIndex);

        const li = document.createElement('li');
        li.textContent = `${item1.name} ↔ ${item2.name}`;
        chaosList.appendChild(li);
    }

    // Display Mastermind Recipes
    const mastermindContainer = document.getElementById('mastermind-container');
    mastermindContainer.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const data = alchemyData[i];
        const card = document.createElement('div');
        card.className = 'mastermind-card';

    const title = document.createElement('h4');
    const catalystLabel = (window.i18n ? i18n.t('catalystLabel') : '催化剂');
    const catName = (i === 6) ? (window.i18n ? i18n.t('chaos') : '混沌') : displayCatalystName(i);
    title.textContent = `${catalystLabel}: ${catName}`;
        card.appendChild(title);

        const recipeList = document.createElement('ul');
        data.code.forEach(substrateIndex => {
            const substrateName = i === 6 ? displayCatalystName(substrateIndex) : displaySubstrateName(i, substrateIndex);
            const li = document.createElement('li');
            li.textContent = substrateName;
            recipeList.appendChild(li);
        });
        card.appendChild(recipeList);
        mastermindContainer.appendChild(card);
    }


    document.getElementById('results').classList.remove('hidden');
});

// 当语言切换时，重新渲染（保持最近一次 seed 输入）
document.addEventListener('locale-changed', () => {
    // 如果已有结果，基于当前输入重算一次
    const seedInput = document.getElementById('seedInput');
    if (!seedInput || !seedInput.value) return;
    document.getElementById('generateButton').click();
});
