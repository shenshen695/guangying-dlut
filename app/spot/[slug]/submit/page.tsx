import { notFound } from "next/navigation";
import SpotSubmissionClient from "@/components/SpotSubmissionClient";
import spotsData from "@/data/spots.json";
import type { Spot } from "@/types/spot";

const spots = spotsData as Spot[];

export function generateStaticParams() {
  return spots.map((spot) => ({ slug: spot.slug }));
}

export default function SubmitSpotPage({ params }: { params: { slug: string } }) {
  const spot = spots.find((item) => item.slug === params.slug);
  if (!spot) notFound();
  return <SpotSubmissionClient spot={spot} />;
}
