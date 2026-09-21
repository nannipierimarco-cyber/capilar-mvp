import DentalGuidePage, {
  createDentalGuideMetadata,
} from "@/app/dental-care/_components/DentalGuidePage";
import { getDentalGuide } from "@/lib/dentalSeoGuides";

const guide = getDentalGuide("comparar-presupuesto-ortodoncia");

export const metadata = createDentalGuideMetadata(guide);

export default function CompararPresupuestoOrtodonciaPage() {
  return <DentalGuidePage guide={guide} />;
}
