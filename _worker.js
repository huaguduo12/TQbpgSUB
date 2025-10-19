let 快速订阅访问入口 = ['PStSUB'];
let addresses = [
'fast-10010.asuscomm.com:443#免费订阅谨防受骗',
'bestcf.030101.xyz:443#勿外传且用且珍惜',
'fenliu.072103.xyz:443#群组：t.me/jiliankeji'
];
let addressesapi = [];
let addressescsv = [];
let DLS = 5000;
let remarkIndex = 1; //CSV备注所在列偏移量
let subConverter = 'subapi.cmliussss.net';
let subConfig = atob('aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2NtbGl1L0FDTDRTU1IvbWFpbi9DbGFzaC9jb25maWcvQUNMNFNTUl9PbmxpbmVfRnVsbF9NdWx0aU1vZGUuaW5p');
let EndPS = '';
let FileName = '极链订阅生成器';
let alpn = 'h3';
const regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\[.*\]):?(\d+)?#?(.*)?$/;
let fakeUserID;
let fakeHostName;
let httpsPorts = ["2053", "2083", "2087", "2096", "8443"];
let 网络备案 = `提供维护: <a href='https://t.me/jiliankeji'>极链科技</a>,想你所想: <a href='https://t.me/jilianso'>资源搜索</a>`; //写你自己的维护者广告
let 网站图标, 网站头像, 网站背景;

async function getNextNode(env) {
    const fallbackNode = { host: 'your-fallback-host.com', uuid: 'your-fallback-uuid-...' };

    // --- START OF KV MODIFICATION for getNextNode ---
    let subLinksSource, hostSource, uuidSource;
    if (env.KV) {
        const [kvSubLinks, kvHost, kvUuid] = await Promise.all([
            env.KV.get('SUB_LINKS'),
            env.KV.get('HOST'),
            env.KV.get('UUID')
        ]);
        subLinksSource = kvSubLinks || env.SUB_LINKS;
        hostSource = kvHost || env.HOST;
        uuidSource = kvUuid || env.UUID || env.PASSWORD;
    } else {
        subLinksSource = env.SUB_LINKS;
        hostSource = env.HOST;
        uuidSource = env.UUID || env.PASSWORD;
    }
    // --- END OF KV MODIFICATION ---

    // 优先级 1: SUB_LINKS (现在使用 subLinksSource)
    if (subLinksSource) {
        try {
            const subLinks = await 整理(subLinksSource);
            const allNodesPromises = subLinks.map(link => fetch(link).then(res => res.ok ? res.text() : "").catch(() => ""));
            const allNodesTexts = await Promise.all(allNodesPromises);
            const processedTexts = allNodesTexts.map(text => { if (!text || !text.trim()) return ""; try { return atob(text); } catch (e) { return text; } });
            const combinedText = processedTexts.join('\n');
            let allParsedNodes = [];
            const uniqueCombinations = new Set();
            const lines = combinedText.split(/[\r\n]+/);
            for (const line of lines) {
                if (line.trim().startsWith("vless://")) {
                    const parsed = parseVlessUrl(line.trim());
                    if (parsed) {
                        const combination = `${parsed.host}|${parsed.uuid}`;
                        if (!uniqueCombinations.has(combination)) {
                            uniqueCombinations.add(combination);
                            allParsedNodes.push(parsed);
                        }
                    }
                }
            }
            if (allParsedNodes.length > 0) {
                const randomNode = allParsedNodes[Math.floor(Math.random() * allParsedNodes.length)];
                console.log(`从 SUB_LINKS(KV/ENV) 获取到节点`);
                return { node: randomNode, source: 'SUB_LINKS' };
            }
        } catch (e) { console.error("从 SUB_LINKS 获取或解析节点失败, 将回退:", e); }
    }

    // 优先级 2: KV (智能节点池，逻辑不变)
    const kvNode = await findAvailableHostSmartly(env);
    if (kvNode) {
        console.log("从 KV (Smartly) 获取到可用节点");
        return { node: kvNode, source: 'KV' };
    }

    const kvAttempted = !!env.KV && !!(await env.KV.get('NODE_CONFIG_LIST'));

    // 优先级 3: 环境变量 (现在使用 hostSource 和 uuidSource)
    if (hostSource || uuidSource) {
        console.log("从 HOST/UUID(KV/ENV) 获取节点");
        const hostValue = hostSource ? await 整理(hostSource) : [fallbackNode.host];
        const host = hostValue[Math.floor(Math.random() * hostValue.length)];
        const uuid = uuidSource || fallbackNode.uuid;
        return { node: { host, uuid }, source: 'ENV' };
    }

    // 优先级 4: 备用值
    console.log("所有来源均失败，返回代码写死备用值");
    const finalSource = kvAttempted ? 'KV_FAILED_ALL' : 'ALL_FAILED';
    return { node: fallbackNode, source: finalSource };
}

async function 整理优选列表(api, env) {
    if (!api || !Array.isArray(api) || api.length === 0) return [];

    const CUSTOM_KEYWORDS = {
      '天诚': 'HK',
      '官方': 'HK',
      '发布': 'HK',
    };
    const COUNTRY_MAPPING = {
        "香港": "HK", "澳门": "MO", "台湾": "TW", "中国": "CN", "大陆": "CN", "日本": "JP", "韩国": "KR", "新加坡": "SG", "马来西亚": "MY", "泰国": "TH", "缅甸": "MM", "越南": "VN", "菲律宾": "PH", "印度尼西亚": "ID", "印度": "IN", "土耳其": "TR", "阿联酋": "AE", "沙特": "SA", "亚美尼亚": "AM", "伊朗": "IR", "柬埔寨": "KH", "吉尔吉斯斯坦": "KG", "哈萨克斯坦": "KZ", "以色列": "IL", "英国": "GB", "法国": "FR", "德国": "DE", "荷兰": "NL", "瑞士": "CH", "俄罗斯": "RU", "白俄罗斯": "BY", "乌克兰": "UA", "意大利": "IT", "西班牙": "ES", "葡萄牙": "PT", "瑞典": "SE", "挪威": "NO", "罗马尼亚": "RO", "丹麦": "DK", "芬兰": "FI", "爱尔兰": "IE", "比利时": "BE", "奥地利": "AT", "波兰": "PL", "捷克": "CZ", "立陶宛": "LT", "匈牙利": "HU", "希腊": "GR", "保加利亚": "BG", "爱沙尼亚": "EE", "拉脱维亚": "LV", "阿尔巴尼亚": "AL", "塞浦路斯": "CY", "格鲁吉亚": "GE", "克罗地亚": "HR", "冰岛": "IS", "列支敦士登": "LI", "摩尔多瓦": "MD", "黑山": "ME", "北马其顿": "MK", "塞尔维亚": "RS", "斯洛文尼亚": "SI", "斯洛伐克": "SK", "美国": "US", "加拿大": "CA", "墨西哥": "MX", "巴西": "BR", "阿根廷": "AR", "智利": "CL", "哥伦比亚": "CO", "澳大利亚": "AU", "新西兰": "NZ", "南非": "ZA", "埃及": "EG", "肯尼亚": "KE", "毛里求斯": "MU", "塞舌尔": "SC", "乌兹别克斯坦": "UZ"
    };
    const CODE_TO_NAME = Object.fromEntries(Object.entries(COUNTRY_MAPPING).map(([name, code]) => [code, name]));
    const CODE_TO_FLAG = {
        "HK": "🇭🇰", "MO": "🇲🇴", "TW": "🇹🇼", "CN": "🇨🇳", "JP": "🇯🇵", "KR": "🇰🇷", "SG": "🇸🇬", "MY": "🇲🇾", "TH": "🇹🇭", "MM": "🇲🇲", "VN": "🇻🇳", "PH": "🇵🇭", "ID": "🇮🇩", "IN": "🇮🇳", "TR": "🇹🇷", "AE": "🇦🇪", "SA": "🇸🇦", "AM": "🇦🇲", "IR": "🇮🇷", "KH": "🇰🇭", "KG": "🇰🇬", "KZ": "🇰🇿", "IL": "🇮🇱", "GB": "🇬🇧", "FR": "🇫🇷", "DE": "🇩🇪", "NL": "🇳🇱", "CH": "🇨🇭", "RU": "🇷🇺", "BY": "🇧🇾", "UA": "🇺🇦", "IT": "🇮🇹", "ES": "🇪🇸", "PT": "🇵🇹", "SE": "🇸🇪", "NO": "🇳🇴", "RO": "🇷🇴", "DK": "🇩🇰", "FI": "🇫🇮", "IE": "🇮🇪", "BE": "🇧🇪", "AT": "🇦🇹", "PL": "🇵🇱", "CZ": "🇨🇿", "LT": "🇱🇹", "HU": "🇭🇺", "GR": "🇬🇷", "BG": "🇧🇬", "EE": "🇪🇪", "LV": "🇱🇻", "AL": "🇦🇱", "CY": "🇨🇾", "GE": "🇬🇪", "HR": "🇭🇷", "IS": "🇮🇸", "LI": "🇱🇮", "MD": "🇲🇩", "ME": "🇲🇪", "MK": "🇲🇰", "RS": "🇷🇸", "SI": "🇸🇮", "SK": "🇸🇰", "US": "🇺🇸", "CA": "🇨🇦", "MX": "🇲🇽", "BR": "🇧🇷", "AR": "🇦🇷", "CL": "🇨🇱", "CO": "🇨🇴", "AU": "🇦🇺", "NZ": "🇳🇿", "ZA": "🇿🇦", "EG": "🇪🇬", "KE": "🇰🇪", "MU": "🇲🇺", "SC": "🇸🇨", "UZ": "🇺🇿", "UNKNOWN": "❓"
    };
    const LOCATION_TO_CODE = {
        'hkg': 'HK', 'hong kong': 'HK', 'mfm': 'MO', 'macau': 'MO', 'tpe': 'TW', 'taipei': 'TW', 'khh': 'TW', 'kaohsiung': 'TW', 'kaohsiung city': 'TW', 'pek': 'CN', 'beijing': 'CN', 'pvg': 'CN', 'shanghai': 'CN', 'szx': 'CN', 'shenzhen': 'CN', 'can': 'CN', 'guangzhou': 'CN', 'nrt': 'JP', 'hnd': 'JP', 'tokyo': 'JP', 'kix': 'JP', 'osaka': 'JP', 'fuk': 'JP', 'fukuoka': 'JP', 'icn': 'KR', 'seoul': 'KR', 'sin': 'SG', 'singapore': 'SG', 'kul': 'MY', 'kuala lumpur': 'MY', 'bkk': 'TH', 'bangkok': 'TH', 'han': 'VN', 'hanoi': 'VN', 'sgn': 'VN', 'ho chi minh city': 'VN', 'mnl': 'PH', 'manila': 'PH', 'cgk': 'ID', 'jakarta': 'ID', 'bom': 'IN', 'mumbai': 'IN', 'del': 'IN', 'delhi': 'IN', 'ist': 'TR', 'istanbul': 'TR', 'dxb': 'AE', 'dubai': 'AE', 'ruh': 'SA', 'riyadh': 'SA', 'evn': 'AM', 'yerevan': 'AM', 'lhr': 'GB', 'london': 'GB', 'man': 'GB', 'manchester': 'GB', 'cdg': 'FR', 'paris': 'FR', 'mrs': 'FR', 'marseille': 'FR', 'fra': 'DE', 'frankfurt': 'DE', 'muc': 'DE', 'munich': 'DE', 'ber': 'DE', 'berlin': 'DE', 'dus': 'DE', 'düsseldorf': 'DE', 'ham': 'DE', 'hamburg': 'DE', 'txl': 'DE', 'ams': 'NL', 'amsterdam': 'NL', 'zrh': 'CH', 'zurich': 'CH', 'svo': 'RU', 'moscow': 'RU', 'dme': 'RU', 'led': 'RU', 'saint petersburg': 'RU', 'kbp': 'UA', 'kyiv': 'UA', 'fco': 'IT', 'rome': 'IT', 'mxp': 'IT', 'milan': 'IT', 'mad': 'ES', 'madrid': 'ES', 'bcn': 'ES', 'barcelona': 'ES', 'lis': 'PT', 'lisbon': 'PT', 'arn': 'SE', 'stockholm': 'SE', 'osl': 'NO', 'oslo': 'NO', 'otp': 'RO', 'bucharest': 'RO', 'cph': 'DK', 'copenhagen': 'DK', 'hel': 'FI', 'helsinki': 'FI', 'dub': 'IE', 'dublin': 'IE', 'bru': 'BE', 'brussels': 'BE', 'vie': 'AT', 'vienna': 'AT', 'waw': 'PL', 'warsaw': 'PL', 'prg': 'CZ', 'prague': 'CZ', 'vno': 'LT', 'vilnius': 'LT', 'bud': 'HU', 'budapest': 'HU', 'ath': 'GR', 'athens': 'GR', 'sof': 'BG', 'sofia': 'BG', 'tll': 'EE', 'tallinn': 'EE', 'rix': 'LV', 'riga': 'LV', 'sjc': 'US', 'san jose': 'US', 'lax': 'US', 'los angeles': 'US', 'sfo': 'US', 'san francisco': 'US', 'sea': 'US', 'seattle': 'US', 'pdx': 'US', 'portland': 'US', 'phx': 'US', 'phoenix': 'US', 'den': 'US', 'denver': 'US', 'ord': 'US', 'chicago': 'US', 'dfw': 'US', 'dallas': 'US', 'jfk': 'US', 'new york': 'US', 'ewr': 'US', 'newark': 'US', 'iad': 'US', 'ashburn': 'US', 'washington': 'US', 'atl': 'US', 'atlanta': 'US', 'mia': 'US', 'miami': 'US', 'buf': 'US', 'buffalo': 'US', 'yyz': 'CA', 'toronto': 'CA', 'yvr': 'CA', 'vancouver': 'CA', 'yul': 'CA', 'montreal': 'CA', 'mex': 'MX', 'mexico city': 'MX', 'gru': 'BR', 'sao paulo': 'BR', 'eze': 'AR', 'buenos aires': 'AR', 'scl': 'CL', 'santiago': 'CL', 'syd': 'AU', 'sydney': 'AU', 'mel': 'AU', 'melbourne': 'AU', 'akl': 'NZ', 'auckland': 'NZ', 'jnb': 'ZA', 'johannesburg': 'ZA', 'cai': 'EG', 'cairo': 'EG'
    };

    const allKeywords = { ...LOCATION_TO_CODE, ...CUSTOM_KEYWORDS };
    const sortedKeywords = Object.keys(allKeywords).sort((a, b) => b.length - a.length);
    // 1. 手动设置 (最低优先级)
    let prefix = ''; // 可在此手动设置默认前缀, 如 '[极链]'
    let suffix = '@jiliankeji'; // 可在此手动设置默认后缀, 如 '-V2'

    // 2. 从环境变量覆盖 (中等优先级)
    if (env && env.PREFIX !== undefined) prefix = env.PREFIX;
    if (env && env.SUFFIX !== undefined) suffix = env.SUFFIX;

    // 3. 从 KV 覆盖 (最高优先级)
    if (env && env.KV) {
    const kvPrefix = await env.KV.get('PREFIX');
    if (kvPrefix !== null) prefix = kvPrefix; // null 表示 KV 中不存在该键

    const kvSuffix = await env.KV.get('SUFFIX');
    if (kvSuffix !== null) suffix = kvSuffix;
    }

    function getCodeFromRemark(remark) {
        if (!remark) return "UNKNOWN";
        const lowerRemark = remark.toLowerCase();
        for (const keyword of sortedKeywords) {
            if (lowerRemark.includes(keyword.toLowerCase())) { return allKeywords[keyword]; }
        }
        const upperRemark = remark.toUpperCase();
        if (CODE_TO_NAME[upperRemark]) { return upperRemark; }
        for (const [name, code] of Object.entries(COUNTRY_MAPPING)) {
            if (remark.includes(name)) { return code; }
        }
        return "UNKNOWN";
    }

    let allLines = "";
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, 2000);

    try {
        const responses = await Promise.allSettled(api.map(apiUrl => fetch(apiUrl, {
            method: 'get',
            headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;', 'User-Agent': FileName + atob('IGNtbGl1L1dvcmtlclZsZXNzMnN1Yg==') },
            signal: controller.signal
        }).then(response => response.ok ? response.text() : Promise.reject())));

        for (const response of responses) {
            if (response.status === 'fulfilled' && response.value) {
                allLines += response.value + '\n';
            }
        }
    } catch (error) { console.error(error); } finally { clearTimeout(timeout); }

    const lines = allLines.trim().split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // 从环境变量中获取输出格式，现在 env 是可访问的
    let styleSource;
    if (env && env.KV) { styleSource = await env.KV.get('STYLE') || env.STYLE; }
    else if (env) { styleSource = env.STYLE; }
    const outputStyle = (styleSource && styleSource.toLowerCase() === 'code') ? 'code' : 'rich';

    const countryCounts = {};
    const finalNodes = [];

    for (const line of lines) {
        if (!line.trim()) continue;
        
        const parts = line.split('#');
        const addressPart = parts[0].trim();
        const originalRemark = parts.length > 1 ? parts.slice(1).join('#').trim() : (addressPart || " ");

        const code = getCodeFromRemark(originalRemark);
        let finalRemark = originalRemark;
        
        if (code !== "UNKNOWN") {
            if (outputStyle === 'rich') {
                countryCounts[code] = (countryCounts[code] || 0) + 1;
                const count = countryCounts[code];
                const flag = CODE_TO_FLAG[code] || '❓';
                const name = CODE_TO_NAME[code] || code;
                finalRemark = `${flag}${name}${count}`;
            } else {
                finalRemark = code;
            }
        }
        
        if (addressPart) {
            finalNodes.push(`${addressPart}#${prefix}${finalRemark}${suffix}`);
        }
    }
    // 使用 await 整理() 是因为原始代码中它是一个 async 函数
    return await 整理(finalNodes.join('\n'));
}

async function 整理测速结果(tls) {
    if (!tls || !Array.isArray(addressescsv) || addressescsv.length === 0) return [];

    function parseCSV(text) {
        return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
            .filter(line => line.trim() !== '').map(line => line.split(',').map(cell => cell.trim()));
    }

    const csvPromises = addressescsv.map(async (csvUrl) => {
        try {
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const text = await response.text();
            const rows = parseCSV(text);
            const [header, ...dataRows] = rows;
            const tlsIndex = header.findIndex(col => col.toUpperCase() === 'TLS');
            if (tlsIndex === -1) throw new Error('CSV missing required fields');

            return dataRows
                .filter(row => {
                    const tlsValue = row[tlsIndex].toUpperCase();
                    const speed = parseFloat(row[row.length - 1]);
                    return tlsValue === tls.toUpperCase() && speed > DLS;
                })
                .map(row => `${row[0]}:${row[1]}#${row[tlsIndex + remarkIndex]}`);
        } catch (error) {
            console.error(`Error processing CSV ${csvUrl}:`, error);
            return [];
        }
    });

    const results = await Promise.all(csvPromises);
    return results.flat();
}

async function 整理(内容) {
    let 替换后的内容 = 内容.replace(/[\t|"'\r\n]+/g, ',').replace(/,+/g, ',');
    if (替换后的内容.startsWith(',')) 替换后的内容 = 替换后的内容.slice(1);
    if (替换后的内容.endsWith(',')) 替换后的内容 = 替换后的内容.slice(0, -1);
    return 替换后的内容.split(',');
}

async function MD5MD5(text) {
    const encoder = new TextEncoder();
    const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
    const firstHex = Array.from(new Uint8Array(firstPass)).map(b => b.toString(16).padStart(2, '0')).join('');
    const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
    return Array.from(new Uint8Array(secondPass)).map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
}

function revertFakeInfo(content, userID, hostName) {
    return content.replace(new RegExp(fakeUserID, 'g'), userID).replace(new RegExp(fakeHostName, 'g'), hostName);
}

function generateFakeInfo(content, userID, hostName) {
    return content.replace(new RegExp(userID, 'g'), fakeUserID).replace(new RegExp(hostName, 'g'), fakeHostName);
}

function isValidIPv4(address) {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(address);
}

export default {
    async fetch(request, env) {
        const themes = {
            1: { primaryColor: '#f4a261', hoverColor: '#e07630', bgColor: '#fce4d6', cardBg: '#555555', gradientColor: 'rgba(252,228,214, 0.8)', qrColor: '#f4a261' },
            2: { primaryColor: '#292524', hoverColor: '#44403c', bgColor: '#1c1917', cardBg: '#292524', gradientColor: 'rgba(41,37,36, 0.8)', qrColor: '#78716c' },
            3: { primaryColor: '#3f8a5f', hoverColor: '#2e6b4b', bgColor: '#e8f5e9', cardBg: '#c8e6c9', gradientColor: 'rgba(63,138,95, 0.8)', qrColor: '#3f8a5f' },
            4: { primaryColor: '#8b5cf6', hoverColor: '#7c3aed', bgColor: '#f5f3ff', cardBg: '#ede9fe', gradientColor: 'rgba(139,92,246, 0.8)', qrColor: '#8b5cf6' },
            5: { primaryColor: '#FF6B81', hoverColor: '#FF4757', bgColor: '#FFE6E6', cardBg: '#FFCDD2', gradientColor: 'rgba(255,107,129, 0.8)', qrColor: '#FF6B81' },
            6: { primaryColor: '#ec4899', hoverColor: '#db2777', bgColor: '#fdf2f8', cardBg: '#fce7f3', gradientColor: 'rgba(236,72,153, 0.8)', qrColor: '#ec4899' },
            7: { primaryColor: '#f97316', hoverColor: '#ea580c', bgColor: '#fff7ed', cardBg: '#ffedd5', gradientColor: 'rgba(249,115,22, 0.8)', qrColor: '#f97316' },
            8: { primaryColor: '#06b6d4', hoverColor: '#0891b2', bgColor: '#ecfeff', cardBg: '#cffafe', gradientColor: 'rgba(6,182,212, 0.8)', qrColor: '#06b6d4' },
            9: { primaryColor: '#6366f1', hoverColor: '#4f46e5', bgColor: '#eef2ff', cardBg: '#e0e7ff', gradientColor: 'rgba(99,102,241, 0.8)', qrColor: '#6366f1' },
            10: { primaryColor: '#14b8a6', hoverColor: '#0d9488', bgColor: '#f0fdfa', cardBg: '#ccfbf1', gradientColor: 'rgba(20,184,166, 0.8)', qrColor: '#14b8a6' }
        };
        let theme;
        if (env.KV) {
            const [
                kvToken, kvSubApi, kvSubConfig, kvSubName, kvPs, kvCfPorts,
                kvColor, kvIco, kvPng, kvImg, kvBeian
            ] = await Promise.all([
                env.KV.get('TOKEN'), env.KV.get('SUBAPI'), env.KV.get('SUBCONFIG'),
                env.KV.get('SUBNAME'), env.KV.get('PS'), env.KV.get('CFPORTS'),
                env.KV.get('COLOR'), env.KV.get('ICO'), env.KV.get('PNG'),
                env.KV.get('IMG'), env.KV.get('BEIAN')
            ]);

            // Process TOKEN
            const tokenSource = kvToken || env.TOKEN;
            if (tokenSource) 快速订阅访问入口 = await 整理(tokenSource);

            // Process global configs
            subConverter = kvSubApi || env.SUBAPI || subConverter;
            subConfig = kvSubConfig || env.SUBCONFIG || subConfig;
            FileName = kvSubName || env.SUBNAME || FileName;
            EndPS = kvPs || env.PS || EndPS;
            const cfPortsSource = kvCfPorts || env.CFPORTS;
            if (cfPortsSource) httpsPorts = await 整理(cfPortsSource);

            // Process appearance configs
            const COLOR = Number(kvColor || env.COLOR) || 1;
            theme = themes[COLOR];
            const icoSource = kvIco || env.ICO;
            网站图标 = icoSource ? `<link rel="icon" sizes="32x32" href="${icoSource}">` : '<link rel="icon" sizes="32x32" href="https://api.jzhou.dedyn.io/极.png?token=JLiptq">';
            const pngSource = kvPng || env.PNG;
            网站头像 = pngSource ? `<div class="logo-wrapper"><div class="logo-border"></div><img src="${pngSource}" alt="Logo"></div>` : '<div class="logo-wrapper"><div class="logo-border"></div><img src="https://api.jzhou.dedyn.io/极.png?token=JLiptq" alt="Logo"></div>';
            const imgSource = kvImg || env.IMG;
            if (imgSource) {
                const imgs = await 整理(imgSource);
                网站背景 = `background-image: url('${imgs[Math.floor(Math.random() * imgs.length)]}');`;
            } else {
                网站背景 = 'background-image: url("https://img.hgd.f5.si/random?type=img&dir=T3");';
            }
            网络备案 = kvBeian || env.BEIAN || env.BY || 网络备案;

        } else {
            // Fallback to original logic if KV is not bound
            const COLOR = Number(env.COLOR) || 1;
            theme = themes[COLOR];
            if (env.TOKEN) 快速订阅访问入口 = await 整理(env.TOKEN);
            subConverter = env.SUBAPI || subConverter;
            subConfig = env.SUBCONFIG || subConfig;
            FileName = env.SUBNAME || FileName;
            if (env.CFPORTS) httpsPorts = await 整理(env.CFPORTS);
            EndPS = env.PS || EndPS;
            网站图标 = env.ICO ? `<link rel="icon" sizes="32x32" href="${env.ICO}">` : '<link rel="icon" sizes="32x32" href="https://api.jzhou.dedyn.io/极.png?token=JLiptq">';
            网站头像 = env.PNG ? `<div class="logo-wrapper"><div class="logo-border"></div><img src="${env.PNG}" alt="Logo"></div>` : '<div class="logo-wrapper"><div class="logo-border"></div><img src="https://api.jzhou.dedyn.io/极.png?token=JLiptq" alt="Logo"></div>';
            if (env.IMG) { const imgs = await 整理(env.IMG); 网站背景 = `background-image: url('${imgs[Math.floor(Math.random() * imgs.length)]}');`; } else { 网站背景 = 'background-image: url("https://img.hgd.f5.si/random?type=img&dir=T3");'; }
            网络备案 = env.BEIAN || env.BY || 网络备案;
        }
        const userAgent = request.headers.get('User-Agent')?.toLowerCase() || "null";
        const url = new URL(request.url);
        const format = url.searchParams.get('format')?.toLowerCase() || "null";
        let host = "", uuid = "", path = "", sni = "", type = "ws", 协议类型;
        const currentDate = new Date();
        const fakeUserIDMD5 = await MD5MD5(Math.ceil(currentDate.getTime()));
        fakeUserID = `${fakeUserIDMD5.slice(0, 8)}-${fakeUserIDMD5.slice(8, 12)}-${fakeUserIDMD5.slice(12, 16)}-${fakeUserIDMD5.slice(16, 20)}-${fakeUserIDMD5.slice(20)}`;
        fakeHostName = `${fakeUserIDMD5.slice(6, 9)}.${fakeUserIDMD5.slice(13, 19)}.xyz`;

        let isKVFailed = false;
        const subPageEnabled = (env.SUB || (env.KV ? await env.KV.get('SUB') : null)) !== 'false';
        // --- 【全新的、正确的逻辑判断结构】 ---
        if (快速订阅访问入口.some(token => url.pathname.includes(token))) {
            // 场景1：正确的快速订阅链接
            let dynamicUUID = null;
            let uuidApiSource, sniSource, typeSource, alpnSource, pathSource;
            if (env.KV) {
                const [kvUuidApi, kvSni, kvType, kvAlpn, kvPath] = await Promise.all([
                    env.KV.get('UUIDAPI'),
                    env.KV.get('SNI'),
                    env.KV.get('TYPE'),
                    env.KV.get('ALPN'),
                    env.KV.get('PATH')
                ]);
                uuidApiSource = kvUuidApi || env.UUIDAPI;
                sniSource = kvSni || env.SNI;
                typeSource = kvType || env.TYPE;
                alpnSource = kvAlpn || env.ALPN;
                pathSource = kvPath || env.PATH;
            } else {
                uuidApiSource = env.UUIDAPI;
                sniSource = env.SNI;
                typeSource = env.TYPE;
                alpnSource = env.ALPN;
                pathSource = env.PATH;
            }

            if (uuidApiSource) {
                try {
                    const response = await fetch(uuidApiSource);
                    if (response.ok) { dynamicUUID = extractUUID(await response.text()); }
                } catch (e) { console.error("请求 UUIDAPI 失败:", e); }
            }

            const nodeResult = await getNextNode(env);
            const node = nodeResult.node;
            if (!node || !node.host) { return new Response("无法从任何来源获取有效的节点主机。", { status: 500 }); }
            if (nodeResult.source === 'KV_FAILED_ALL') {
                isKVFailed = true;
            }

            host = node.host;
            const useTrojan = env.PASSWORD || node.password;
            uuid = dynamicUUID || env.PASSWORD || node.password || node.uuid;
            if (!uuid) { return new Response("无法确定有效的UUID或密码。", { status: 500 }); }

            path = pathSource || "/?ed=2560";
            sni = sniSource || host;
            type = typeSource || type;
            alpn = alpnSource || alpn;

            if (useTrojan) { 协议类型 = atob('VHJvamFu'); } else { 协议类型 = atob('VkxFU1M='); }

        } else if (subPageEnabled && url.pathname === '/') {
            // 场景2：访问首页
            return subHtml(request, theme);

        } else if (subPageEnabled && url.pathname.includes("/sub")) {
            // 场景3：手动生成订阅链接
            host = url.searchParams.get('host');
            uuid = url.searchParams.get('uuid') || url.searchParams.get('password') || url.searchParams.get('pw') || url.searchParams.get('PASSWORD');
            path = url.searchParams.get('path');
            sni = url.searchParams.get('sni') || host;
            type = url.searchParams.get('type') || type;
            alpn = url.searchParams.get('alpn') || alpn;
            if (url.searchParams.has('password') || url.searchParams.has('pw') || url.searchParams.has('PASSWORD')) { 协议类型 = atob('VHJvamFu'); } else { 协议类型 = atob('VkxFU1M='); }
            
            if (!host || !uuid) { return new Response(`缺少必填参数：host 和 uuid`, { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
            if (!path || path.trim() === '') { path = '/?ed=2560'; } else { path = path.startsWith('/') ? path : '/' + path; }

        } else {
            // 场景4：所有其他无效路径 (Token 错误等)
            const isSubscriptionClient = userAgent.includes('clash') || userAgent.includes('sing-box') || userAgent.includes('singbox') || userAgent.includes('v2ray') || userAgent.includes('nekobox') || userAgent.includes('shadowrocket');

            if (isSubscriptionClient) {
                // 来源是客户端 -> 返回提示节点
                console.log("无效的订阅路径，UA为客户端，准备生成提示节点...");
                const fallbackNode = { host: 'your-fallback-host.com', uuid: 'your-fallback-uuid-...' };
                const errorHost = fallbackNode.host;
                const errorUuid = fallbackNode.uuid;
                const errorPath = "/?ed=2560", errorSni = errorHost, errorType = "ws", errorAlpn = "h3";
                const error协议类型 = atob('VkxFU1M=');
                const errorMessages = ['密码错误或已失效', '请去极链技术交流群', '获取最新链接', '群组t.me/jiliankeji'];
                const errorAddresses = errorMessages.map(msg => `1.1.1.1:443#${msg}`);

                const responseBody = errorAddresses.map(addressLine => {
                    const address = "1.1.1.1", port = "443", addressid = addressLine.split('#')[1] || '';
                    if (error协议类型 === atob('VHJvamFu')) {
                        return `${atob('dHJvamFuOi8v') + errorUuid}@${address}:${port}?security=tls&sni=${errorSni}&fp=randomized&type=${errorType}&alpn=${encodeURIComponent(errorAlpn)}&host=${errorHost}&path=${encodeURIComponent(errorPath)}#${encodeURIComponent(addressid)}`;
                    } else {
                        return `${atob('dmxlc3M6Ly8=') + errorUuid}@${address}:${port}?encryption=none&security=tls&sni=${errorSni}&fp=random&type=${errorType}&alpn=${encodeURIComponent(errorAlpn)}&host=${errorHost}&path=${encodeURIComponent(errorPath)}#${encodeURIComponent(addressid)}`;
                    }
                }).join('\n');
                return new Response(btoa(responseBody), { headers: { "content-type": "text/plain; charset=utf-8", "Profile-web-page-url": url.origin } });
            } else {
                // 来源是浏览器 -> 返回HTML错误页面
                const errorHtml = `
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>无效访问</title>
                    <style>
                        body {
                            margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                            display: flex; justify-content: center; align-items: center; min-height: 100vh;
                            background-color: #f4f7f9; color: #333;
                        }
                        .container {
                            text-align: center; background-color: white; padding: 40px 50px; border-radius: 12px;
                            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); transform: translateY(-20px); transition: transform 0.3s ease-in-out;
                        }
                        .container:hover { transform: translateY(-25px); }
                        h1 { font-size: 24px; color: #d9534f; margin-bottom: 15px; }
                        p { font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
                        a {
                            color: #007bff; text-decoration: none; font-weight: bold; border-bottom: 2px dashed #007bff;
                            padding-bottom: 2px; transition: color 0.2s, border-bottom-color 0.2s;
                        }
                        a:hover { color: #0056b3; border-bottom-color: #0056b3; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>密码错误，禁止访问！</h1>
                        <p>您使用的密码不正确或已失效。<br>请加入极链技术交流群获取最新的访问密码。</p>
                        <a href="https://t.me/jiliankeji" target="_blank" rel="noopener noreferrer">点击加入群组：jiliankeji</a>
                    </div>
                </body>
                </html>`;
                return new Response(errorHtml, {
                    status: 403,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                });
            }
        }

        // --- 【公共处理区域】 ---
        // 只有场景1(快速订阅)和场景3(手动生成)会执行到这里
        if (isKVFailed) {
            console.log("KV中所有Host均失效，触发全局熔断，仅输出Fallback节点作为提示。");
            addresses = ['butong.com:443#你们真厉害',
                'bunengtong.com:443#今日流量用尽了',
                'tongbuliao.com:443#我罢工啦',
                'nanshou.com:443#明日请早吧',
                'dengdeng.com:443#我上早八的@jiliankeji'];
            addressesapi = [];
            addressescsv = [];
        } else {
            addresses = [
                'fast-10010.asuscomm.com:443#免费订阅谨防受骗',
                'bestcf.030101.xyz:443#勿外传且用且珍惜',
                'fenliu.072103.xyz:443#群组：t.me/jiliankeji'
            ];
            addressesapi = [];
            addressescsv = [];

            let dlsSource, csvRemarkSource, uuidTimeSource, addSource, addApiSource, addCsvSource;
            if (env.KV) {
                const [kvDls, kvCsvRemark, kvUuidTime, kvAdd, kvAddApi, kvAddCsv] = await Promise.all([
                    env.KV.get('DLS'), env.KV.get('CSVREMARK'), env.KV.get('UUIDTIME'),
                    env.KV.get('ADD'), env.KV.get('ADDAPI'), env.KV.get('ADDCSV')
                ]);
                dlsSource = kvDls || env.DLS;
                csvRemarkSource = kvCsvRemark || env.CSVREMARK;
                uuidTimeSource = kvUuidTime || env.UUIDTIME;
                addSource = kvAdd || env.ADD;
                addApiSource = kvAddApi || env.ADDAPI;
                addCsvSource = kvAddCsv || env.ADDCSV;
            } else {
                dlsSource = env.DLS;
                csvRemarkSource = env.CSVREMARK;
                uuidTimeSource = env.UUIDTIME;
                addSource = env.ADD;
                addApiSource = env.ADDAPI;
                addCsvSource = env.ADDCSV;
            }

            if (addSource) addresses = await 整理(addSource);
            if (addApiSource) addressesapi = await 整理(addApiSource);
            if (addCsvSource) addressescsv = await 整理(addCsvSource);

            DLS = Number(dlsSource) || DLS;
            remarkIndex = Number(csvRemarkSource) || remarkIndex;
            
            const isQuickSub = 快速订阅访问入口.some(token => url.pathname.includes(token));
            if (isQuickSub) {
                let countdownSeconds = 0;
                if (uuidTimeSource) {
                    const userSeconds = parseInt(uuidTimeSource, 10);
                    if (!isNaN(userSeconds) && userSeconds > 0) {
                        countdownSeconds = userSeconds;
                    }
                }
                if (countdownSeconds > 0) {
                    const expiryTime = getBeijingTime(countdownSeconds);
                    const countdownNode = `skk.moe:443#到期日: ${expiryTime}`;
                    const instructionNode = `malaysia.com:443#到期更新订阅即可`;
                    addresses.unshift(instructionNode);
                    addresses.unshift(countdownNode);
                }
            }
        }

        const httpRegex = /^https?:\/\//i;
        addressesapi.push(...addresses.filter(item => httpRegex.test(item)));
        addresses = addresses.filter(item => !httpRegex.test(item));

        let subConverterUrl = generateFakeInfo(url.href, uuid, host);

        if ((userAgent.includes('clash') || format === 'clash') && !userAgent.includes('nekobox')) {
            subConverterUrl = `https://${subConverter}/sub?target=clash&url=${encodeURIComponent(subConverterUrl)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
        } else if (userAgent.includes('sing-box') || userAgent.includes('singbox') || format === 'singbox') {
            subConverterUrl = `https://${subConverter}/sub?target=singbox&url=${encodeURIComponent(subConverterUrl)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
        } else {
            const newAddressesapi = await 整理优选列表(addressesapi, env);
            const newAddressescsv = await 整理测速结果('TRUE');
            const uniqueAddresses = [...new Set(addresses.concat(newAddressesapi, newAddressescsv).filter(item => item && item.trim()))];
            const responseBody = uniqueAddresses.map(addressLine => {
                let address = addressLine, port = "443", addressid = addressLine;
                const match = addressLine.match(regex);
                if (match) { address = match[1]; port = match[2] || "443"; addressid = match[3] || address; } else { if (addressLine.includes('#')) { const parts = addressLine.split('#'); addressid = parts[1]; const hostPort = parts[0].split(':'); address = hostPort[0]; port = hostPort[1] || "443"; } else if (addressLine.includes(':')) { const hostPort = addressLine.split(':'); address = hostPort[0]; port = hostPort[1]; } }
                if (!isValidIPv4(address)) { for (let httpsPort of httpsPorts) { if (address.includes(httpsPort) && (!match || !match[2])) { port = httpsPort; break; } } }
                if (协议类型 === atob('VHJvamFu')) { return `${atob('dHJvamFuOi8v') + uuid}@${address}:${port}?security=tls&sni=${sni}&fp=randomized&type=${type}&alpn=${encodeURIComponent(alpn)}&host=${host}&path=${encodeURIComponent(path)}#${encodeURIComponent(addressid + EndPS)}`; } else { return `${atob('dmxlc3M6Ly8=') + uuid}@${address}:${port}?encryption=none&security=tls&sni=${sni}&fp=random&type=${type}&alpn=${encodeURIComponent(alpn)}&host=${host}&path=${encodeURIComponent(path)}#${encodeURIComponent(addressid + EndPS)}`; }
            }).join('\n');
            return new Response(btoa(responseBody), { headers: { "content-type": "text/plain; charset=utf-8", "Profile-web-page-url": url.origin, }, });
        }
        try {
            const subConverterResponse = await fetch(subConverterUrl);
            if (!subConverterResponse.ok) { throw new Error(`Error fetching subConverterUrl: ${subConverterResponse.status} ${subConverterResponse.statusText}`); }
            let subConverterContent = await subConverterResponse.text();
            subConverterContent = revertFakeInfo(subConverterContent, uuid, host);
            return new Response(subConverterContent, { headers: { "Content-Disposition": `attachment; filename*=utf-8''${encodeURIComponent(FileName)}; filename=${FileName}`, "content-type": "text/plain; charset=utf-8", "Profile-web-page-url": url.origin, }, });
        } catch (error) { return new Response(`Error: ${error.message}`, { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' }, }); }
    }
};

async function subHtml(request, theme) {
    const url = new URL(request.url);
    const HTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${FileName}</title>
        ${网站图标}
        <style>
            :root {
                --primary-color: ${theme.primaryColor}; --hover-color: ${theme.hoverColor}; --bg-color: ${theme.bgColor};
                --gradient-color: ${theme.gradientColor}; --card-bg: ${theme.cardBg};
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { ${网站背景} background-size: cover; background-position: center; background-attachment: fixed; background-color: var(--bg-color); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; min-height: 100vh; display: flex; justify-content: center; align-items: center; }
            .container { position: relative; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(1px); -webkit-backdrop-filter: blur(1px); max-width: 600px; width: 90%; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.1); transition: transform 0.3s ease; }
            .container:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.1); }
            h1 { text-align: center; color: var(--primary-color); margin-bottom: 2rem; font-size: 1.8rem; }
            ::selection { background: var(--primary-color); color: white; }
            .input-group { margin-bottom: 1.5rem; }
            label { display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500; }
            input { width: 100%; padding: 12px; border: 2px solid rgba(0, 0, 0, 0.15); border-radius: 10px; font-size: 1rem; transition: all 0.3s ease; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03); }
            input:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15), inset 0 2px 4px rgba(0, 0, 0, 0.03); }
            button { width: 100%; padding: 12px; background-color: var(--primary-color); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-bottom: 1.5rem; }
            button:hover { background-color: var(--hover-color); transform: translateY(-2px); }
            button:active { transform: translateY(0); }
            #result { background-color: #f8f9fa; font-family: monospace; word-break: break-all; }
            .github-corner svg { fill: var(--primary-color); color: var(--card-bg); position: absolute; top: 0; right: 0; border: 0; width: 80px; height: 80px; }
            .github-corner:hover .octo-arm { animation: octocat-wave 560ms ease-in-out; }
            @keyframes octocat-wave { 0%, 100% { transform: rotate(0) } 20%, 60% { transform: rotate(-25deg) } 40%, 80% { transform: rotate(10deg) } }
            .logo-title { position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 2rem; }
            .logo-wrapper { position: absolute; left: 0; width: 50px; height: 50px; }
            .logo-title img { width: 100%; height: 100%; border-radius: 50%; position: relative; z-index: 1; background: var(--card-bg); box-shadow: 0 0 15px rgba(67, 97, 238, 0.1); }
            .logo-border { position: absolute; top: -3px; left: -3px; right: -3px; bottom: -3px; border-radius: 50%; animation: rotate 3s linear infinite; background: linear-gradient(from 0deg, transparent 0%, var(--gradient-color) 20%, var(--gradient-color) 40%, transparent 60%, transparent 100%); box-shadow: 0 0 10px rgba(67, 97, 238, 0.3); filter: blur(0.5px); }
            .logo-border::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--card-bg); }
            @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .logo-title h1 { margin-bottom: 0; text-align: center; }
            .beian-info { text-align: center; font-size: 13px; }
            .beian-info a { color: var(--primary-color); text-decoration: none; border-bottom: 1px dashed var(--primary-color); padding-bottom: 2px; }
            .beian-info a:hover { border-bottom-style: solid; }
            #qrcode { display: flex; justify-content: center; align-items: center; margin-top: 20px; }
            .info-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background-color: var(--primary-color); color: white; font-size: 12px; margin-left: 8px; cursor: pointer; font-weight: bold; position: relative; top: -3px; }
            .info-tooltip { display: none; position: fixed; background: white; border: 1px solid var(--primary-color); border-radius: 8px; padding: 15px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.1); min-width: 200px; max-width: 90vw; width: max-content; left: 50%; top: 50%; transform: translate(-50%, -50%); margin: 0; line-height: 1.6; font-size: 13px; white-space: normal; word-wrap: break-word; overflow-wrap: break-word; }
            .info-tooltip::before { display: none; }
            @media (max-width: 480px) { .container { padding: 1.5rem; } h1 { font-size: 1.5rem; } .github-corner:hover .octo-arm { animation: none; } .github-corner .octo-arm { animation: octocat-wave 560ms ease-in-out; } .logo-wrapper { width: 40px; height: 40px; } }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
    </head>
    <body>
      <a href="${atob('aHR0cHM6Ly9naXRodWIuY29tL2NtbGl1L1dvcmtlclZsZXNzMnN1Yg==')}" target="_blank" class="github-corner" aria-label="View source on Github"><svg viewBox="0 0 250 250" aria-hidden="true"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a>
      <div class="container">
          <div class="logo-title">${网站头像}<h1>${FileName}</h1></div>
          <div class="input-group">
              <label for="link" style="font-weight: bold;">节点链接</label>
              <input type="text" id="link" placeholder="输入 VLESS / Trojan 节点链接">
          </div>
          <button onclick="generateLink()">生成优选订阅</button>
          <div class="input-group">
              <div style="display: flex; align-items: center;">
                  <label for="result" style="font-weight: bold;">优选订阅</label>
                  <div style="position: relative;">
                      <span class="info-icon" onclick="toggleTooltip(event)">!</span>
                      <div class="info-tooltip" id="infoTooltip">
                          <strong>安全提示</strong>：使用优选订阅生成器时，需要您提交 <strong>节点配置信息</strong> 用于生成优选订阅链接。这意味着订阅器的维护者可能会获取到该节点信息。<strong>请自行斟酌使用风险。</strong><br><br>
                          订阅转换后端：<strong>${subConverter}</strong><br>
                          订阅转换配置文件：<strong>${subConfig}</strong>
                      </div>
                  </div>
              </div>
              <input type="text" id="result" readonly onclick="copyToClipboard()">
              <label id="qrcode" style="margin: 15px 10px -15px 10px;"></label>
          </div>
          <div class="beian-info">${网络备案}</div>
      </div>
      <script>
        function toggleTooltip(event) {
          event.stopPropagation();
          const tooltip = document.getElementById('infoTooltip');
          tooltip.style.display = tooltip.style.display === 'block' ? 'none' : 'block';
        }
        document.addEventListener('click', function(event) {
          const tooltip = document.getElementById('infoTooltip');
          const infoIcon = document.querySelector('.info-icon');
          if (!tooltip.contains(event.target) && !infoIcon.contains(event.target)) {
            tooltip.style.display = 'none';
          }
        });
        function copyToClipboard() {
          const resultInput = document.getElementById('result');
          if (!resultInput.value) return;
          resultInput.select();
          navigator.clipboard.writeText(resultInput.value).then(() => {
            const tooltip = document.createElement('div');
            tooltip.style.cssText = 'position: fixed; left: 50%; top: 20px; transform: translateX(-50%); padding: 8px 16px; background: var(--primary-color); color: white; border-radius: 4px; z-index: 1000;';
            tooltip.textContent = '已复制到剪贴板';
            document.body.appendChild(tooltip);
            setTimeout(() => { document.body.removeChild(tooltip); }, 2000);
          }).catch(err => { alert('复制失败'); });
        }
        function generateLink() {
          const link = document.getElementById('link').value;
          if (!link) {
            alert('请输入节点链接');
            return;
          }
          let uuidType = link.startsWith('trojan://') ? 'password' : 'uuid';
          let subLink = '';
          try {
            const uuid = link.split("//")[1].split("@")[0];
            const search = link.split("?")[1].split("#")[0];
            const domain = window.location.hostname;
            subLink = \`https://\${domain}/sub?\${uuidType}=\${uuid}&\${search}\`;
            document.getElementById('result').value = subLink;
            new QRCode(document.getElementById('qrcode'), {
              text: subLink, width: 220, height: 220,
              colorDark: "${theme.qrColor}", colorLight: "#ffffff",
              correctLevel: QRCode.CorrectLevel.L, scale: 1
            });
          } catch (error) {
            alert('链接格式错误，请检查输入');
          }
        }
      </script>
    </body>
    </html>`;
    return new Response(HTML, { headers: { "content-type": "text/html;charset=UTF-8" } });
}

function getBeijingTime(secondsToAdd = 0) {
    const now = new Date();

    now.setSeconds(now.getSeconds() + secondsToAdd);

    const formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(now).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}

function parseVlessUrl(url) {
    try {
        const urlObject = new URL(url);
        const uuid = urlObject.username;
        const host = urlObject.searchParams.get('host') || urlObject.hostname;

        if (uuid && host) {
            return { host, uuid };
        }
        return null;
    } catch (e) {
        return null;
    }
}
function extractUUID(text) {
  if (!text) return null;
  const trimmedText = text.trim();
  
  try {
      const jsonObject = JSON.parse(trimmedText);
      if (jsonObject && typeof jsonObject.uuid === 'string') {
          if (/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/.test(jsonObject.uuid)) {
              console.log("成功从JSON中提取UUID。");
              return jsonObject.uuid;
          }
      }
  } catch (e) {
      // 不是JSON，继续
  }

  const smartMatch = trimmedText.match(/(?:uuid|password)[\s:=]+([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/i);
  if (smartMatch && smartMatch[1]) {
      console.log("成功通过正则表达式从文本中提取UUID。");
      return smartMatch[1];
  }
  if (/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/i.test(trimmedText)) {
      console.log("成功将整个纯文本识别为UUID。");
      return trimmedText;
  }
  console.log("在文本中未找到任何有效的UUID格式。");
  return null;
}

async function checkNodeAvailability(host, port = 443, timeout = 1000) {
  try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const url = `https://${host}/`;
      
      const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
              'Upgrade': 'websocket',
              'Connection': 'Upgrade',
              'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
              'Sec-WebSocket-Version': '13'
          },
          redirect: 'manual'
      });

      clearTimeout(timeoutId);

      if (response.status === 101) {
          console.log(`[WebSocket Handshake Check] PASSED for ${host}. Status: 101`);
          return true;
      } else {
          console.log(`[WebSocket Handshake Check] FAILED for ${host}. Expected 101, got ${response.status}`);
          return false;
      }
  } catch (error) {
      console.log(`[WebSocket Handshake Check] FAILED for ${host}: ${error.message}`);
      return false;
  }
}
async function findAvailableHostSmartly(env) {
    if (!env.KV) {
        return null;
    }
  
    const nodeListValue = await env.KV.get('NODE_CONFIG_LIST');
    if (!nodeListValue) {
        return null;
    }
  
    let hostPool;
    try {
        hostPool = JSON.parse(nodeListValue);
    } catch (e) {
        console.error("KV中NODE_CONFIG_LIST非有效JSON");
        return null;
    }
  
    if (!Array.isArray(hostPool) || hostPool.length === 0) {
        return null;
    }
  
    // --- [新增逻辑] 读取健康检查开关 ---
    const checkHostValue = (env.KV ? await env.KV.get('CHECK_HOST') : env.CHECK_HOST);
    const shouldSkipCheck = checkHostValue === 'false'; // 只有明确为'false'时才跳过
  
    // --- [新增逻辑] 如果跳过检查，则执行快速轮询 ---
    if (shouldSkipCheck) {
        let currentIndex = await env.KV.get('node_index');
        currentIndex = currentIndex ? parseInt(currentIndex) : 0;
        if (currentIndex >= hostPool.length) {
            currentIndex = 0;
        }
        const selectedNode = hostPool[currentIndex];
        const nextIndex = (currentIndex + 1) % hostPool.length;
        await env.KV.put('node_index', nextIndex.toString());
        console.log(`[Health Check Skipped] 轮询到节点: ${selectedNode.host}`);
        return selectedNode;
    }
    
    // --- [原始逻辑] 如果不跳过检查，则执行完整的健康检查 ---
    console.log(`[Health Check Enabled] 开始检查节点...`);
    const deadListValue = await env.KV.get('DEAD_HOST_LIST');
    let deadHosts = deadListValue ? JSON.parse(deadListValue) : [];
    
    let currentIndex = await env.KV.get('node_index');
    currentIndex = currentIndex ? parseInt(currentIndex) : 0;
  
    for (let i = 0; i < hostPool.length; i++) {
        let loopIndex = (currentIndex + i) % hostPool.length;
        const currentNode = hostPool[loopIndex];
  
        if (deadHosts.includes(currentNode.host)) {
            console.log(`Host ${currentNode.host} 在死亡名单中，跳过。`);
            continue;
        }
  
        const isAlive = await checkNodeAvailability(currentNode.host);
  
        if (isAlive) {
            const finalNextIndex = (loopIndex + 1) % hostPool.length;
            await env.KV.put('node_index', finalNextIndex.toString());
            return currentNode;
        } else {
            const deadHostSet = new Set(deadHosts);
            deadHostSet.add(currentNode.host);
            deadHosts = Array.from(deadHostSet);
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setUTCDate(now.getUTCDate() + 1);
            tomorrow.setUTCHours(0, 1, 0, 0);
            const ttlInSeconds = Math.max(60, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
            await env.KV.put('DEAD_HOST_LIST', JSON.stringify(deadHosts), { expirationTtl: ttlInSeconds });
        }
    }

  return null;
}
