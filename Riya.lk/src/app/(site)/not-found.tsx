import Link from "next/link";
import { SearchX } from "lucide-react";
import { Container, EmptyState } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <Container className="py-16">
      <EmptyState
        icon={<SearchX className="size-6" />}
        title={t.notFound.title}
        text={t.notFound.text}
        action={
          <Link href="/" className={buttonClass()}>
            {t.notFound.goHome}
          </Link>
        }
      />
    </Container>
  );
}
