// スピードテスト用: 下り計測エンドポイント（ダミーデータを流す）
// ?mb= でサイズ指定（1〜100MB、既定25MB）
export async function onRequest({ request }) {
  const url = new URL(request.url);
  let mb = parseInt(url.searchParams.get('mb') || '25', 10);
  if (isNaN(mb)) mb = 25;
  mb = Math.min(100, Math.max(1, mb));
  const total = mb * 1024 * 1024;
  const chunk = new Uint8Array(64 * 1024);
  for (let i = 0; i < chunk.length; i++) chunk[i] = (i * 31 + 7) & 0xff;
  let sent = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (sent >= total) { controller.close(); return; }
      const n = Math.min(chunk.length, total - sent);
      controller.enqueue(n === chunk.length ? chunk : chunk.subarray(0, n));
      sent += n;
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(total),
      'Cache-Control': 'no-store',
    },
  });
}
