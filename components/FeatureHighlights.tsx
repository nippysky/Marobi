import React from "react";
import { Truck, Award, Info } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "International Delivery",
    description: "Marobi ships worldwide using trusted courier services.",
  },
  {
    icon: Award,
    title: "Bespoke Quality",
    description: "Hand-picked, crafted materials for premium, tailored style.",
  },
  {
    icon: Info,
    title: "Get in Touch",
    description: "Reach out via email or social media for more information.",
  },
];

const FeatureHighlights: React.FC = () => (
  <section className=" lg:py-20 py-10 bg-background lg:px-20 md:px-10 px-5">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {features.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="
            flex flex-col 
            items-start 
            gap-5 
            w-full         /* full width on mobile so all start at same edge */
            md:w-fit       /* shrink-to-fit on md+ */
            md:mx-auto     /* center on md+ */
          "
        >
          {/* fixed 10×10 container to center the actual SVG */}
          <div className="w-10 h-10 flex items-center justify-center text-muted-foreground">
            <Icon className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default FeatureHighlights;
