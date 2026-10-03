"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Container, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

/** Error boundary for public pages. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-16">
      <EmptyState
        icon={<TriangleAlert className="size-6" />}
        title={t.common.somethingWentWrong}
        text={t.errors.serverError}
        action={<Button onClick={reset}>{t.common.tryAgain}</Button>}
      />
    </Container>
  );
}
