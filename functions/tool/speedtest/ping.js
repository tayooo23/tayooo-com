// スピードテスト用: Ping計測エンドポイント（空の応答を即返す）
export async function onRequest() {
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
}
