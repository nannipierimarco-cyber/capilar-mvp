import DentalGuidePage, {
  createDentalGuideMetadata,
} from "@/app/dental-care/_components/DentalGuidePage";
import { getDentalGuide } from "@/lib/dentalSeoGuides";

const guide = getDentalGuide("presupuesto-dental-caro");

export const metadata = createDentalGuideMetadata(guide);

export default function PresupuestoDentalCaroPage() {
  return <DentalGuidePage guide={guide} />;
}
