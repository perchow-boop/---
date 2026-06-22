import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    id: "cat1",
    name: "祈願符",
    meta: "以紙與墨承載的祝願",
    description:
      "以傳統書法與簡潔符語，書寫你的願望並放入祈願盒，保留手作的溫度與儀式感。",
    image: "/pics/cat01.png",
    href: "/products?category=祈願符",
  },
  {
    id: "cat2",
    name: "消災符",
    meta: "護佑日常的細節",
    description:
      "以天然材質與簡約符樣，為居家帶來安定與祝福，適合擺放於門口或書桌角落。",
    image: "/pics/cat02.png",
    href: "/products?category=消災符",
  },
  {
    id: "cat3",
    name: "答案紙",
    meta: "書寫與回應的紙語",
    description:
      "精選紙張與印刷工藝，為思考與祈願提供一張安靜的空白，讓文字成為儀式的一部分。",
    image: "/pics/cat03.png",
    href: "/products?category=答案紙",
  },
];

export function CategoryCards() {
  return (
    <section className="relative z-10 mx-auto -mt-10 grid max-w-6xl grid-cols-1 gap-5 px-6 md:grid-cols-2 lg:grid-cols-3" aria-label="精選分類">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={category.href}
          className="group flex flex-col items-center rounded-xl bg-surface p-4 text-center shadow-[0_8px_20px_rgba(15,15,15,0.06)] transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(15,15,15,0.08)]"
        >
          <Image
            src={category.image}
            alt={`${category.name} — ${category.meta}`}
            width={400}
            height={300}
            className="h-auto w-full rounded-lg object-cover"
          />
          <h3 className="mt-3 font-serif text-base font-semibold text-text">
            {category.name}
          </h3>
          <div className="text-sm text-muted">{category.meta}</div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {category.description}
          </p>
        </Link>
      ))}
    </section>
  );
}
