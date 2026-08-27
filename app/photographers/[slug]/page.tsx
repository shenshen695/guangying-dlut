import { notFound } from "next/navigation";
import photographersData from "@/data/photographers.json";
import PhotographerProfileClient from "@/components/PhotographerProfileClient";
import { PageShell } from "@/components/guangying-ui";
import type { Photographer } from "@/types/photographer";

const photographers = photographersData as Photographer[];

export function generateStaticParams() {
  return photographers.map((photographer) => ({ slug: photographer.slug }));
}

export default function PhotographerProfilePage({ params }: { params: { slug: string } }) {
  const photographer = photographers.find((item) => item.slug === params.slug);
  if (!photographer) notFound();

  return (
    <PageShell active="摄影者" actionLabel="返回目录" actionHref="/photographers">
      <PhotographerProfileClient photographer={photographer} />
    </PageShell>
  );
}
