import DentalGuidePage, {
  createDentalGuideMetadata,
} from "@/app/dental-care/_components/DentalGuidePage";
import { getDentalGuide } from "@/lib/dentalSeoGuides";

const guide = getDentalGuide("segunda-opinion-presupuesto-dental");

export const metadata = createDentalGuideMetadata(guide);

export default function SegundaOpinionPresupuestoDentalPage() {
  return <DentalGuidePage guide={guide} />;
}
