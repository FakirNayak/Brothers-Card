import Hero from "@/Component/Hero/Hero";
import Services from "@/Component/services/Services";
import Image from "next/image";

export default function Home() {
  return (
    <div className="">
      <main className="">
        <Hero />
        <Services />
      </main>
    </div>
  );
}
