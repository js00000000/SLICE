export const onRequestPost: PagesFunction<{
  LINE_CHANNEL_ACCESS_TOKEN: string;
  APP_URL?: string;
}> = async (context) => {
  const { request, env } = context;

  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.error("Missing LINE_CHANNEL_ACCESS_TOKEN");
    return new Response("Server configuration error", { status: 500 });
  }

  // 1. 解析來自 SLICE 前端的請求資料
  let body: {
    lineGroupId: string;
    groupName: string;
    groupId: string;
    settlements: Array<{ fromName: string; toName: string; amount: number }>;
    currencySymbol?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { lineGroupId, groupName, groupId, settlements, currencySymbol = "$" } = body;

  if (!lineGroupId || !groupName || !groupId || !settlements) {
    return new Response("Missing required parameters", { status: 400 });
  }

  const appUrl = env.APP_URL || "https://preview.slice-75o.pages.dev";

  // 2. 構建 LINE Flex Message JSON 結構
  const flexMessage = createSettlementFlexMessage(groupName, groupId, settlements, currencySymbol, appUrl);

  // 3. 呼叫 LINE Push Message API 發送訊息到群組
  const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: lineGroupId,
      messages: [
        {
          type: "flex",
          altText: `【SLICE】${groupName} 帳單結算通知`,
          contents: flexMessage,
        },
      ],
    }),
  });

  if (!lineResponse.ok) {
    const errorText = await lineResponse.text();
    console.error("Failed to send LINE Push Message:", lineResponse.status, errorText);
    return new Response(`LINE API Error: ${errorText}`, { status: 502 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * 產生美觀的 LINE Flex Message 氣泡圖
 */
function createSettlementFlexMessage(
  groupName: string,
  groupId: string,
  settlements: Array<{ fromName: string; toName: string; amount: number }>,
  currencySymbol: string,
  appUrl: string
) {
  // 建立結算明細區塊的內容
  const settlementRows = settlements.map((s) => ({
    type: "box",
    layout: "horizontal",
    margin: "md",
    contents: [
      {
        type: "text",
        text: s.fromName,
        size: "sm",
        color: "#555555",
        flex: 3,
        align: "start" as const,
      },
      {
        type: "text",
        text: "➔",
        size: "sm",
        color: "#FF6B35",
        flex: 1,
        align: "center" as const,
      },
      {
        type: "text",
        text: s.toName,
        size: "sm",
        color: "#555555",
        flex: 3,
        align: "start" as const,
      },
      {
        type: "text",
        text: `${currencySymbol}${s.amount.toFixed(0)}`,
        size: "sm",
        weight: "bold" as const,
        color: "#1A1A2E",
        flex: 3,
        align: "end" as const,
      },
    ],
  }));

  // 如果沒有任何需要結算的帳目
  if (settlements.length === 0) {
    settlementRows.push({
      type: "box",
      layout: "horizontal",
      margin: "md",
      contents: [
        {
          type: "text",
          text: "🎉 所有帳目已結清，無須付款！",
          size: "sm",
          color: "#0A7A4A",
          align: "center" as const,
        },
      ],
    });
  }

  return {
    type: "bubble",
    size: "mega" as const,
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#FF6B35",
      contents: [
        {
          type: "text",
          text: "SLICE 結算通知",
          weight: "bold" as const,
          color: "#FFFFFF",
          size: "lg",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: groupName,
          weight: "bold" as const,
          size: "xl",
          color: "#1A1A2E",
        },
        {
          type: "text",
          text: "主辦人已完成帳單結算，建議付款明細如下：",
          size: "xs",
          color: "#aaaaaa",
          wrap: true,
          margin: "sm",
        },
        {
          type: "separator",
          margin: "md",
        },
        {
          type: "box",
          layout: "vertical",
          margin: "md",
          contents: settlementRows,
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary" as const,
          height: "sm",
          color: "#1A1A2E",
          action: {
            type: "uri",
            label: "查看 SLICE 詳情",
            uri: `${appUrl}/group/${groupId}`,
          },
        },
      ],
    },
  };
}
