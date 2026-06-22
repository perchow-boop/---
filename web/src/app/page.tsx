import { Hero } from "@/components/home/Hero";
import { CategoryCards } from "@/components/home/CategoryCards";
import { AboutTeaser } from "@/components/home/AboutTeaser";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryCards />
      <AboutTeaser />
    </>
  );
}
