import MainPhase3 from "@/components/scrolly/MainPhase3";
import "@/styles/marketing.css";

export const metadata = {
  title: "Tierless — Demo Scroll",
  description: "Test sticky scene with wireframe globe and overlay reveal.",
};

export default function Page() {
  return (
    <main className="min-h-screen w-full">
      {/* Malo prostora pre scene (scroll ulaz) */}
      <div className="h-[20vh]" />
      <MainPhase3 />
      {/* Spacer za kraj da ne “zapne” odmah pri dnu taba */}
      <div className="h-[10vh]" />
    </main>
  );
}