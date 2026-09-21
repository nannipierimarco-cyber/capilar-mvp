import DentalGuidePage, {
  createDentalGuideMetadata,
} from "@/app/dental-care/_components/DentalGuidePage";
import { getDentalGuide } from "@/lib/dentalSeoGuides";

const guide = getDentalGuide("comparar-presupuesto-implantes-dentales");

export const metadata = createDentalGuideMetadata(guide);

export default function CompararPresupuestoImplantesDentalesPage() {
  return <DentalGuidePage guide={guide} />;
}
