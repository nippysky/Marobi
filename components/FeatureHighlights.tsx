import React from "react";
import { Truck, Scissors, Headphones } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Worldwide Shipping",
    description:
      "Enjoy fast, reliable delivery to every corner of the globe—so your Marobi wardrobe arrives just when you need it.",
  },
  {
    icon: Scissors,
    title: "Tailored Elegance",
    description:
      "Handcrafted female silhouettes—expertly tailored to your measurements for the perfect, confidence‑boosting fit.",
  },
  {
    icon: Headphones,
    title: "24/7 Style Support",
    description:
      "Need a second opinion? Our fashion concierges are here day and night to help you curate your next standout look.",
  },
];

const FeatureHighlights: React.FC = () => (
  <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
    <div className="max-w-7xl mx-auto px-4">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        Why Marobi?
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="
              bg-white bg-opacity-70 backdrop-blur-md
              p-8 rounded-3xl shadow-lg
              hover:shadow-2xl transition
              transform hover:-translate-y-2
              flex flex-col items-center text-center
            "
          >
            <div className="w-16 h-16 flex items-center justify-center mb-6
                            bg-gradient-to-br from-green-500 to-brand
                            rounded-full">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600">{description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureHighlights;
