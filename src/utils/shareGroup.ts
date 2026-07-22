import toast from 'react-hot-toast';

interface ShareGroupOptions {
  groupName?: string;
  joinId?: string;
  groupId?: string;
  isZh: boolean;
  copiedToastMsg?: string;
}

export function getGroupJoinUrl(joinId?: string, groupId?: string): string {
  const code = joinId || groupId || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://slice.fusion-labs.cc';
  return `${origin}/join/${code}`;
}

export async function copyGroupLink({
  joinId,
  groupId,
  isZh,
  copiedToastMsg,
}: Omit<ShareGroupOptions, 'groupName'>) {
  const joinUrl = getGroupJoinUrl(joinId, groupId);
  try {
    await navigator.clipboard.writeText(joinUrl);
    toast.success(copiedToastMsg || (isZh ? '已複製邀請連結' : 'Invite link copied'));
  } catch {
    toast.error(isZh ? '複製失敗，請手動複製' : 'Failed to copy');
  }
}

export async function shareGroup({
  groupName = '',
  joinId,
  groupId,
  isZh,
  copiedToastMsg,
}: ShareGroupOptions) {
  const joinUrl = getGroupJoinUrl(joinId, groupId);
  const title = groupName || (isZh ? '未命名旅程' : 'Untitled Group');

  // Native share sheets append `url` separately from `text`, so the link must
  // NOT also be embedded in `text` there — otherwise it shows up twice.
  const shareBody = isZh
    ? `🎉 邀請你加入「${title}」的 SLICE 🍕 分帳群組！\n不用下載 APP，點擊連結即可一起上記帳與結算：`
    : `🎉 You're invited to join "${title}" on SLICE 🍕!\nNo app download needed — tap the link to start splitting:`;

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Use native system share sheet ONLY on mobile devices when Web Share API is available
  if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `${title} - SLICE 🍕`,
        text: shareBody,
        url: joinUrl,
      });
      return;
    } catch (err) {
      // If user cancelled native share sheet, do nothing; if unsupported error, fall back to copy
      if ((err as Error).name === 'AbortError') {
        return;
      }
    }
  }

  // Desktop or fallback: copy direct join link to clipboard
  try {
    await navigator.clipboard.writeText(joinUrl);
    toast.success(copiedToastMsg || (isZh ? '已複製邀請連結' : 'Invite link copied'));
  } catch {
    // Edge-case fallback if clipboard fails
    toast.error(isZh ? '複製失敗，請手動複製' : 'Failed to copy');
  }
}

