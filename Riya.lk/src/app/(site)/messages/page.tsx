import { MessagesSquare } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

/** Desktop placeholder shown next to the conversation list. */
export default async function MessagesIndexPage() {
  const { t } = await getI18n();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted/30 p-8 text-center text-muted-foreground">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
        <MessagesSquare className="size-8" />
      </span>
      <p>{t.chat.selectConversation}</p>
    </div>
  );
}
