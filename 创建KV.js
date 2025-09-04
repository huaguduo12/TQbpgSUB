// =================================================================
// 自动更新程序 (Service Worker 语法版本)
// =================================================================

// 1. 添加 fetch 事件监听器 (用于手动触发)
addEventListener('fetch', event => {
    event.respondWith(handleFetch(event));
  });
  
  // 2. 添加 scheduled 事件监听器 (用于定时触发)
  addEventListener('scheduled', event => {
    console.log("Cron Trigger activated: Starting Node update process.");
    // 在旧的 Service Worker 格式中，环境变量和KV绑定在全局作用域
    // 我们需要手动将它们组合成一个 'env' 对象传递给函数
    const env = { KV, SOURCE_URL, FETCH_COUNT };
    event.waitUntil(updateNodeList(env));
  });
  
  // 3. 这是一个新的辅助函数，用来处理 fetch 请求
  async function handleFetch(event) {
    const request = event.request;
    const url = new URL(request.url);
  
    if (url.searchParams.get('run') === 'true') {
        console.log("Manual trigger via Fetch API received.");
        // 手动组合 'env' 对象
        const env = { KV, SOURCE_URL, FETCH_COUNT };
        event.waitUntil(updateNodeList(env));
        return new Response("Update process triggered successfully in the background. Check Worker logs for details.", { status: 200 });
    }
    return new Response("This is an updater worker. To trigger an update manually, add '?run=true' to the URL.", { status: 403 });
  }
  
  /**
  * 核心更新逻辑 - 修改为写入匹配的 Host 和 UUID 的 JSON 格式
  * @param {object} env - 包含KV绑定和环境变量的对象
  */
  async function updateNodeList(env) {
    if (!env.KV) {
        console.error("KV namespace is not bound.");
        return;
    }
    const sourceUrl = env.SOURCE_URL;
    const fetchCount = parseInt(env.FETCH_COUNT, 10) || 1;
  
    if (!sourceUrl) {
        console.error("Environment variable 'SOURCE_URL' is not set.");
        return;
    }
    
    console.log(`Starting sequential fetch process: ${fetchCount} requests to ${sourceUrl}`);
    
    // 使用 Map 来确保每个 host (sni) 只对应一个 uuid，并自动去重
    const nodeMap = new Map(); 
  
    try {
        // 使用 for 循环实现串行请求
        for (let i = 0; i < fetchCount; i++) {
            console.log(`Fetching batch ${i + 1} of ${fetchCount}...`);
            
            try {
                const response = await fetch(sourceUrl);
                if (response.ok) {
                    const content = await response.text();
                    let decodedContent;
                    try {
                        decodedContent = atob(content);
                    } catch (e) {
                        decodedContent = content;
                    }
                    
                    const links = decodedContent.split(/\r?\n/);
                    let foundInBatch = 0;
                    links.forEach(link => {
                        link = link.trim();
                        if (link.startsWith('vless://')) {
                            try {
                                // 1. 从链接中提取 UUID
                                const uuid = link.substring(8, 44);
                                
                                // 2. 从链接参数中提取 SNI (作为 host)
                                const urlParams = new URL(link);
                                const sni = urlParams.searchParams.get('sni');
                                
                                // 3. 确保 UUID 和 SNI 都存在且合法
                                if (uuid && uuid.length === 36 && sni) {
                                    // 如果这个 sni 还没记录过，就添加进去
                                    if (!nodeMap.has(sni)) {
                                        nodeMap.set(sni, uuid);
                                        foundInBatch++;
                                    }
                                }
                            } catch (e) {
                                // 忽略解析失败的链接
                            }
                        }
                    });
                    console.log(`Batch ${i + 1} successful, found ${foundInBatch} new unique nodes.`);
                } else {
                    console.warn(`Fetch for batch ${i + 1} failed with status: ${response.status}`);
                }
            } catch (fetchError) {
                console.error(`Fetch for batch ${i + 1} threw an error:`, fetchError);
            }
  
            // 如果不是最后一次循环，则等待2秒
            if (i < fetchCount - 1) {
                console.log("Waiting for 2 seconds before next fetch...");
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
  
        if (nodeMap.size === 0) {
            console.warn("No valid nodes found across all fetches. KV will not be updated.");
            return;
        }
  
        // 4. 将 Map 转换成我们需要的 JSON 数组格式
        const nodeList = Array.from(nodeMap.entries()).map(([host, uuid]) => {
            return { host, uuid };
        });
  
        // 5. 将 JSON 数组字符串化并写入 KV
        // 使用 JSON.stringify 的第三个参数 2 来格式化输出，方便在后台查看
        await env.KV.put('NODE_CONFIG_LIST', JSON.stringify(nodeList, null, 2));
  
        console.log(`Update complete. Successfully updated NODE_CONFIG_LIST with ${nodeList.length} unique nodes.`);
        
        // 6. 每次更新后重置索引，确保从第一个新节点开始轮询
        await env.KV.put('node_index', '0'); 
        console.log("Node index has been reset to 0.");
  
    } catch (error) {
        console.error('Update process failed with an unexpected error:', error);
    }
  }
