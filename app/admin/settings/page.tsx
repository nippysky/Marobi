import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ImageIcon, Ruler} from "lucide-react"

export default function StoreSettingsPage() {
  const cards = [
    {
      href: "/admin/settings/hero-slider",
      title: "Hero Slider",
      description: "Manage homepage carousel images, headlines & CTAs",
      icon: <ImageIcon className="h-8 w-8 text-green-700 group-hover:text-green-900" />,
      bg: "bg-green-100",
    },
    {
      href: "/admin/settings/size-chart",
      title: "Size Chart",
      description: "Edit product size guide: labels & measurements",
      icon: <Ruler className="h-8 w-8 text-blue-700 group-hover:text-blue-900" />,
      bg: "bg-blue-100",
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Store Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 self-center">
        {cards.map(({ href, title, description, icon, bg }) => (
          <Link key={href} href={href} className="block">
            <Card className="group cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center p-6 space-y-4">
                <div className={`${bg} p-3 rounded-full`}>
                  {icon}
                </div>
                <CardTitle className="text-xl font-semibold group-hover:text-gray-900">
                  {title}
                </CardTitle>
                <p className="text-sm text-gray-600 text-center">
                  {description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
