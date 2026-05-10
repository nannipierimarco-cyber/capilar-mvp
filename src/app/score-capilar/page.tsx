import type { Metadata } from "next";
import ScoreCapilarFunnel from "./ScoreCapilarFunnel";

export const metadata: Metadata = {
  title: "Score Capilar Gratis — Perfecto",
  description:
    "Descubre tu Score Capilar gratis. Responde unas preguntas simples, sube 2 fotos y recibe una orientación preliminar para entender tu ruta capilar.",
};

export default function ScoreCapilarPage() {
  return <ScoreCapilarFunnel />;
}
