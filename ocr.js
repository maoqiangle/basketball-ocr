// api/ocr.js
export const config = {
  runtime: 'edge', // 使用 Edge Runtime，速度更快
};

export default async function handler(req) {
  // 1. 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Proxy-Secret',
      },
    });
  }

  // 2. 只允许 POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 3. 获取请求体和 Header
    const body = await req.text();
    const secret = req.headers.get('X-Proxy-Secret');
    
    // 4. 验证密码 (从环境变量读取)
    const expectedSecret = process.env.PROXY_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. 调用火山引擎 API
    const apiKey = process.env.VOLCES_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server Config Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: body,
    });

    const data = await response.json();

    // 6. 返回结果
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
