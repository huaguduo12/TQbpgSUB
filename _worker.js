let 快速订阅访问入口 = ['huaguduo'];
let addresses = [
'fast-10010.asuscomm.com:443#免费订阅谨防受骗',
'bestcf.030101.xyz:443#勿外传且用且珍惜',
'fenliu.072103.xyz:443#群组：t.me/jiliankeji'
];
let addressesapi = [];
let addressescsv = [];
let DLS = 5000;
let remarkIndex = 1; //CSV备注所在列偏移量
let subConverter = 'SUBAPI.cmliussss.net';
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

  // 优先级 1: SUB_LINKS
  if (env.SUB_LINKS) {
      try {
          const subLinks = await 整理(env.SUB_LINKS);
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
              console.log(`从 SUB_LINKS 获取到节点`);
              return { node: randomNode, source: 'SUB_LINKS' };
          }
      } catch (e) { console.error("从 SUB_LINKS 获取或解析节点失败, 将回退:", e); }
  }
  
  // 优先级 2: KV
  const kvNode = await findAvailableHostSmartly(env);
  if (kvNode) {
      console.log("从 KV (Smartly) 获取到可用节点");
      return { node: kvNode, source: 'KV' };
  }

  // 检查 KV 是否被尝试过但失败了
  const kvAttempted = !!env.KV && !!(await env.KV.get('NODE_CONFIG_LIST'));

  // 优先级 3: 环境变量
  if (env.HOST || env.UUID) {
      console.log("从环境变量获取节点");
      const hostValue = env.HOST ? await 整理(env.HOST) : [fallbackNode.host];
      const host = hostValue[Math.floor(Math.random() * hostValue.length)];
      const uuid = env.UUID || env.PASSWORD || fallbackNode.uuid;
      return { node: { host, uuid }, source: 'ENV' };
  }
  
  // 优先级 4: 备用值
  console.log("所有来源均失败，返回代码写死备用值");
  const finalSource = kvAttempted ? 'KV_FAILED_ALL' : 'ALL_FAILED';
  return { node: fallbackNode, source: finalSource };
}

async function 整理优选列表(api) {
    if (!api || api.length === 0) return [];
    let newapi = "";
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, 2000);

    try {
        const responses = await Promise.allSettled(api.map(apiUrl => fetch(apiUrl, {
            method: 'get',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;',
                'User-Agent': FileName + atob('IGNtbGl1L1dvcmtlclZsZXNzMnN1Yg==')
            },
            signal: controller.signal
        }).then(response => response.ok ? response.text() : Promise.reject())));

        for (const [index, response] of responses.entries()) {
            if (response.status === 'fulfilled') {
                const content = await response.value;
                const lines = content.split(/\r?\n/);
                let 节点备注 = '';
                let 测速端口 = '443';

                if (lines[0].split(',').length > 3) { // Simple CSV check
                    const idMatch = api[index].match(/id=([^&]*)/);
                    if (idMatch) 节点备注 = idMatch[1];
                    const portMatch = api[index].match(/port=([^&]*)/);
                    if (portMatch) 测速端口 = portMatch[1];
                    for (let i = 1; i < lines.length; i++) {
                        const columns = lines[i].split(',')[0];
                        if (columns) newapi += `${columns}:${测速端口}${节点备注 ? `#${节点备注}` : ''}\n`;
                    }
                } else {
                    newapi += content + '\n';
                }
            }
        }
    } catch (error) {
        console.error(error);
    } finally {
        clearTimeout(timeout);
    }

    return await 整理(newapi);
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
        const COLOR = Number(env.COLOR) || 1;
        const theme = themes[COLOR];
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
        const userAgent = request.headers.get('User-Agent')?.toLowerCase() || "null";
        const url = new URL(request.url);
        const format = url.searchParams.get('format')?.toLowerCase() || "null";
        let host = "", uuid = "", path = "", sni = "", type = "ws", 协议类型;
        const currentDate = new Date();
        const fakeUserIDMD5 = await MD5MD5(Math.ceil(currentDate.getTime()));
        fakeUserID = `${fakeUserIDMD5.slice(0, 8)}-${fakeUserIDMD5.slice(8, 12)}-${fakeUserIDMD5.slice(12, 16)}-${fakeUserIDMD5.slice(16, 20)}-${fakeUserIDMD5.slice(20)}`;
        fakeHostName = `${fakeUserIDMD5.slice(6, 9)}.${fakeUserIDMD5.slice(13, 19)}.xyz`;

        let isKVFailed = false; 
        let isQuickSub = false;

        if (快速订阅访问入口.some(token => url.pathname.includes(token))) {
            isQuickSub = true;
            let dynamicUUID = null;
            if (env.UUIDAPI) {
                try {
                    const response = await fetch(env.UUIDAPI);
                    if (response.ok) { dynamicUUID = extractUUID(await response.text()); }
                } catch (e) { console.error("请求 UUIDAPI 失败:", e); }
            }
            const nodeResult = await getNextNode(env);
            const node = nodeResult.node;
            if (!node || !node.host) { return new Response("无法从任何来源获取有效的节点主机。", { status: 500 }); }
            
            if (nodeResult.source === 'KV_FAILED_ALL') {
                isKVFailed = true; // 设置熔断标志
            }

            host = node.host;
            const useTrojan = env.PASSWORD || node.password;
            uuid = dynamicUUID || env.PASSWORD || node.password || node.uuid;
            if (!uuid) { return new Response("无法确定有效的UUID或密码。", { status: 500 }); }
            path = env.PATH || "/?ed=2560";
            sni = env.SNI || host;
            type = env.TYPE || type;
            alpn = env.ALPN || alpn;
            if (useTrojan) { 协议类型 = atob('VHJvamFu'); } else { 协议类型 = atob('VkxFU1M='); }
        } else {
            host = url.searchParams.get('host');
            uuid = url.searchParams.get('uuid') || url.searchParams.get('password') || url.searchParams.get('pw') || url.searchParams.get('PASSWORD');
            path = url.searchParams.get('path');
            sni = url.searchParams.get('sni') || host;
            type = url.searchParams.get('type') || type;
            alpn = url.searchParams.get('alpn') || alpn;
            if (url.searchParams.has('password') || url.searchParams.has('pw') || url.searchParams.has('PASSWORD')) { 协议类型 = atob('VHJvamFu'); } else { 协议类型 = atob('VkxFU1M='); }
            if (!url.pathname.includes("/sub")) { return subHtml(request, theme); }
            if (!host || !uuid) { return new Response(`缺少必填参数：host 和 uuid`, { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
            if (!path || path.trim() === '') { path = '/?ed=2560'; } else { path = path.startsWith('/') ? path : '/' + path; }
        }

        // --- 【新的公共处理区域】 ---
        // 无论走哪条路，都会在这里处理优选IP列表
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
            // 重置/加载所有节点来源
            addresses = [
                'fast-10010.asuscomm.com:443#免费订阅谨防受骗',
                'bestcf.030101.xyz:443#勿外传且用且珍惜',
                'fenliu.072103.xyz:443#群组：t.me/jiliankeji'
            ];
            addressesapi = [];
            addressescsv = [];
            if (env.ADD) addresses = await 整理(env.ADD);
            if (env.ADDAPI) addressesapi = await 整理(env.ADDAPI);
            if (env.ADDCSV) addressescsv = await 整理(env.ADDCSV);
            DLS = Number(env.DLS) || DLS;
            remarkIndex = Number(env.CSVREMARK) || remarkIndex;
            
            // 【关键修正】只有在快速订阅路径下，才执行倒计时逻辑
            if (isQuickSub) {
                let countdownSeconds = 0;
                if (env.UUIDTIME) { 
                    const userSeconds = parseInt(env.UUIDTIME, 10); 
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
            subConverterUrl = `https://$subConverter}/sub?target=singbox&url=${encodeURIComponent(subConverterUrl)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
        } else {
            const newAddressesapi = await 整理优选列表(addressesapi);
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

  const deadListValue = await env.KV.get('DEAD_HOST_LIST');
  let deadHosts = deadListValue ? JSON.parse(deadListValue) : [];
  
  let currentIndex = await env.KV.get('node_index');
  currentIndex = currentIndex ? parseInt(currentIndex) : 0;

  for (let i = 0; i < hostPool.length; i++) {
      if (currentIndex >= hostPool.length) {
          currentIndex = 0;
      }

      const currentNode = hostPool[currentIndex];
      const nextIndex = (currentIndex + 1) % hostPool.length;

      if (deadHosts.includes(currentNode.host)) {
          console.log(`Host ${currentNode.host} 在死亡名单中，跳过。`);
          currentIndex = nextIndex;
          continue;
      }

      const isAlive = await checkNodeAvailability(currentNode.host);

      if (isAlive) {
          await env.KV.put('node_index', nextIndex.toString());
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
          currentIndex = nextIndex;
      }
  }

  return null;
}
