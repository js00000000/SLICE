export const onRequestPost: PagesFunction<{
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  APP_URL?: string;
  LINE_BOT_USER_ID?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
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
      source?: {
        type: string;
        groupId?: string;
        userId?: string;
      };
      message?: {
        type: string;
        text: string;
        mention?: {
          mentionees?: Array<{
            index: number;
            length: number;
            type: string;
            userId?: string;
          }>;
        };
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
    // 4.1 當機器人被邀請加入群組時 (join)
    if (event.type === "join" && event.source?.type === "group" && event.source.groupId) {
      const replyToken = event.replyToken;
      const lineGroupId = event.source.groupId;
      
      const appUrl = env.APP_URL || "https://preview.slice-75o.pages.dev";
      const bindUrl = `${appUrl}/group-bind?lineGroupId=${lineGroupId}`;
      
      const welcomeText = `🎉 感謝邀請 SLICE 記帳機器人！\n\n為了在此群組同步結算明細，請點選以下連結將此 LINE 群組與您的 SLICE 網頁群組進行綁定：\n\n👉 ${bindUrl}\n\n（綁定後，當主辦人點擊「結算群組」時，我就會把結算明細發送到這裡喔！）`;

      await replyLineMessages(replyToken, [{ type: "text", text: welcomeText }], env.LINE_CHANNEL_ACCESS_TOKEN);
      continue;
    }

    // 4.2 當機器人退出或被移出群組時 (leave)
    if (event.type === "leave" && event.source?.type === "group" && event.source.groupId) {
      const lineGroupId = event.source.groupId;
      
      if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
        try {
          await unbindLineGroupIdFromFirestore(
            env.FIREBASE_PROJECT_ID,
            env.FIREBASE_CLIENT_EMAIL,
            env.FIREBASE_PRIVATE_KEY,
            lineGroupId
          );
        } catch (dbErr) {
          console.error("Failed to unbind lineGroupId in webhook:", dbErr);
        }
      } else {
        console.warn("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY. Skipping DB unbind.");
      }
      continue;
    }

    // 4.3 處理收到文字訊息的事件
    if (event.type === "message" && event.message?.type === "text") {
      const replyToken = event.replyToken;

      // 判斷是否需要回應：
      // 1. 如果是 1 對 1 私訊 (user)，一律回應
      // 2. 如果是群組 (group)，只在標記 (Mentioned) 機器人的 LINE User ID 時才回應
      let shouldReply = false;

      if (event.source?.type === "user") {
        shouldReply = true;
      } else if (event.source?.type === "group") {
        console.log("LINE_BOT_USER_ID configured:", env.LINE_BOT_USER_ID);
        console.log("Mentions in event message:", JSON.stringify(event.message.mention));

        const isMentionedById = env.LINE_BOT_USER_ID && event.message.mention?.mentionees?.some(
          m => m.userId === env.LINE_BOT_USER_ID
        );

        console.log("isMentionedById result:", isMentionedById);

        if (isMentionedById) {
          shouldReply = true;
        }
      }

      if (!shouldReply) {
        continue;
      }

      // 回覆服務選單與說明 (Flex Message)
      const appUrl = env.APP_URL || "https://preview.slice-75o.pages.dev";
      const servicesFlex = createServicesFlexMessage(appUrl, event.source?.groupId || null);

      await replyLineMessages(replyToken, [
        {
          type: "flex",
          altText: "【SLICE】服務選單與說明",
          contents: servicesFlex,
        }
      ], env.LINE_CHANNEL_ACCESS_TOKEN);
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
 * 呼叫 LINE Messaging API 回覆多筆訊息 (支援 Text 或 Flex)
 */
async function replyLineMessages(replyToken: string, messages: Record<string, unknown>[], channelAccessToken: string): Promise<void> {
  const url = "https://api.line.me/v2/bot/message/reply";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to reply to LINE:", response.status, errorText);
  }
}

/**
 * 產生美觀的服務說明選單 Flex Message
 */
function createServicesFlexMessage(appUrl: string, lineGroupId: string | null) {
  const footerContents: Record<string, unknown>[] = [
    {
      type: "button",
      style: "primary" as const,
      height: "sm" as const,
      color: "#1A1A2E",
      action: {
        type: "uri",
        label: "造訪 SLICE 官網",
        uri: appUrl,
      },
    },
  ];

  if (lineGroupId) {
    footerContents.push({
      type: "button",
      style: "secondary" as const,
      height: "sm" as const,
      color: "#FF6B35",
      action: {
        type: "uri",
        label: "綁定此 LINE 群組",
        uri: `${appUrl}/group-bind?lineGroupId=${lineGroupId}`,
      },
    });
  }

  return {
    type: "bubble" as const,
    size: "mega" as const,
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#FF6B35",
      contents: [
        {
          type: "text",
          text: "SLICE 記帳助手",
          weight: "bold" as const,
          color: "#FFFFFF",
          size: "lg",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md" as const,
      contents: [
        {
          type: "text",
          text: "哈囉！我是 SLICE 記帳助理。我可以協助您在 LINE 中進行快速分帳與結算通知！",
          size: "sm",
          color: "#1A1A2E",
          wrap: true,
          weight: "bold" as const,
        },
        {
          type: "separator",
          margin: "lg" as const,
        },
        {
          type: "text",
          text: "💡 我們提供的服務：",
          weight: "bold" as const,
          size: "sm",
          color: "#FF6B35",
          margin: "md" as const,
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "sm" as const,
          margin: "sm" as const,
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "•",
                  size: "sm",
                  color: "#FF6B35",
                  flex: 1,
                },
                {
                  type: "text",
                  text: "群組綁定：邀請我加入群組後，點擊專屬連結可與網頁端群組綁定。",
                  size: "sm",
                  color: "#555555",
                  wrap: true,
                  flex: 11,
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "•",
                  size: "sm",
                  color: "#FF6B35",
                  flex: 1,
                },
                {
                  type: "text",
                  text: "自動結算通知：主辦人於網頁點擊結算後，可手動將精美的結算付款明細推播至此 LINE 群組中。",
                  size: "sm",
                  color: "#555555",
                  wrap: true,
                  flex: 11,
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm" as const,
      contents: footerContents,
    },
  };
}

/**
 * Helpers for Firestore Admin REST API operations
 */

function base64url(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function stringToBase64url(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return base64url(data.buffer);
}

async function getFirestoreAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const cleanKey = privateKeyPem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");

  const binaryKey = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign"]
  );

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const tokenString = `${stringToBase64url(JSON.stringify(header))}.${stringToBase64url(JSON.stringify(payload))}`;
  const encoder = new TextEncoder();
  const tokenData = encoder.encode(tokenString);

  const signatureBuffer = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    tokenData
  );

  const signedJwt = `${tokenString}.${base64url(signatureBuffer)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to exchange JWT for access token: ${errorText}`);
  }

  const data: { access_token: string } = await res.json();
  return data.access_token;
}

async function unbindLineGroupIdFromFirestore(
  projectId: string,
  clientEmail: string,
  privateKey: string,
  lineGroupId: string
): Promise<void> {
  const token = await getFirestoreAccessToken(clientEmail, privateKey);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

  const queryPayload = {
    structuredQuery: {
      from: [{ collectionId: "groups" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "lineGroupId" },
          op: "EQUAL",
          value: { stringValue: lineGroupId }
        }
      }
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(queryPayload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore query failed: ${errText}`);
  }

  const results = await res.json() as Array<{ document?: { name: string } }>;

  for (const result of results) {
    if (!result.document) continue;
    const docPath = result.document.name;
    
    const patchUrl = `https://firestore.googleapis.com/v1/${docPath}?updateMask.fieldPaths=lineGroupId`;
    
    const patchBody = {
      fields: {}
    };

    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(patchBody)
    });

    if (!patchRes.ok) {
      const patchErr = await patchRes.text();
      console.error(`Failed to patch group ${docPath}:`, patchErr);
    }
  }
}
