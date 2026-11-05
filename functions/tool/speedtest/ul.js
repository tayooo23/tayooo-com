// スピードテスト用: 上り計測エンドポイント（受け取って捨てる）
export async function onRequest({ request }) {
  if (request.body) {
    const reader = request.body.getReader();
    try {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    } catch (e) { /* 切断時はそのまま応答する */ }
  }
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
}
