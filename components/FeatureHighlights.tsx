// components/FeatureHighlights.tsx
import React from "react";
import { Truck, Award, Info } from "lucide-react";

const features = [
  {
    icon: <Truck className="w-10 h-10 text-muted-foreground" />,
    title: "International Delivery",
    description: "Marobi ships worldwide using trusted courier services.",
  },
  {
    icon: <Award className="w-10 h-10 text-muted-foreground" />,
    title: "Bespoke Quality",
    description: "Hand-picked, crafted materials for premium, tailored style.",
  },
  {
    icon: <Info className="w-10 h-10 text-muted-foreground" />,
    title: "Get in Touch",
    description: "Reach out via email or social media for more information.",
  },
];

const FeatureHighlights: React.FC = () => (
  <section className="mt-10 lg:py-20 py-10 bg-background lg:px-20 md:px-10 px-5">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {features.map(({ icon, title, description }) => (
        <div
          key={title}
          className="flex flex-col gap-5 w-fit mx-auto"
        >
          {icon}
          <div>
            <h3 className="text-lg font-semibold text-muted-foreground">
              {title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default FeatureHighlights;
