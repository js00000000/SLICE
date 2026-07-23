export const onRequestPost: PagesFunction<{
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
}> = async (context) => {
  const { request, env } = context;

  // 1. 取得 LINE Webhook 傳來的原始 Body 文字 (驗證簽章必須使用原始文字)
  const bodyText = await request.text();

  // 2. 取得 LINE 傳來的簽章標頭
  const signature = request.headers.get("x-line-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 401 });
  }

  if (!env.LINE_CHANNEL_SECRET || !env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.error("Missing environment variables: LINE_CHANNEL_SECRET or LINE_CHANNEL_ACCESS_TOKEN");
    return new Response("Server configuration error", { status: 500 });
  }

  // 3. 驗證數位簽章 (確認此請求來自 LINE 官方伺服器而非惡意假冒)
  const isValid = await verifyLineSignature(bodyText, env.LINE_CHANNEL_SECRET, signature);
  if (!isValid) {
    return new Response("Invalid signature", { status: 403 });
  }

  // 4. 解析 Webhook 事件
  let payload: {
    events?: Array<{
      type: string;
      replyToken: string;
      message: {
        type: string;
        text: string;
      };
    }>;
  };
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  const events = payload.events || [];

  for (const event of events) {
    // 處理收到文字訊息的事件
    if (event.type === "message" && event.message.type === "text") {
      const replyToken = event.replyToken;
      const userMessage = event.message.text.trim();

      // TODO: 在這裡擴充你的分帳邏輯或對接 Firebase Firestore。
      // 例如：
      // - 解析指令 (例如: /add 150 午餐)
      // - 利用 Firebase REST API 或 Firebase Web SDK 將明細寫入 Firestore
      
      // 目前預設做一個簡單的回覆測試 (Echo)
      const replyText = `收到您的訊息了！您說的是：\n"${userMessage}"\n\n(此為 SLICE LINE Webhook 測試回覆)`;
      
      await replyLineMessage(replyToken, replyText, env.LINE_CHANNEL_ACCESS_TOKEN);
    }
  }

  // 5. 成功處理後，必須回傳 HTTP 200 OK
  return new Response("OK", { status: 200 });
};

/**
 * 使用 Web Crypto API 驗證 LINE 簽章 (HMAC-SHA256)
 */
async function verifyLineSignature(body: string, channelSecret: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(channelSecret);
  const messageData = encoder.encode(body);

  // 匯入金鑰
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // 計算 HMAC-SHA256 簽章
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
  
  // 轉為 Base64 格式
  const expectedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );

  return expectedSignature === signature;
}

/**
 * 呼叫 LINE Messaging API 回覆訊息
 */
async function replyLineMessage(replyToken: string, text: string, channelAccessToken: string): Promise<void> {
  const url = "https://api.line.me/v2/bot/message/reply";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [
        {
          type: "text",
          text,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to reply to LINE:", response.status, errorText);
  }
}
