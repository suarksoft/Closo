"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

const guides = [
  {
    id: "1",
    title: "Start a side business",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80",
  },
  {
    id: "2",
    title: "Ecommerce business ideas",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
  },
  {
    id: "3",
    title: "Start an online business and work from home",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80",
  },
]

export function Testimonials() {
  return (
    <>
      {/* AI Director Era Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-[#222325] rounded-2xl p-8 lg:p-16 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white font-light mb-6 leading-tight">
                The AI Sales era<br />has arrived
              </h2>
              <p className="text-[#95979D] text-lg mb-8 max-w-md">
                From lead to close, work with our AI-powered sales assistant to create 
                scroll-stopping pitches and campaigns that drive real impact.
              </p>
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white rounded-md text-white hover:bg-white hover:text-[#222325] transition-colors font-medium"
              >
                Find your AI Assistant
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className={`w-24 h-32 lg:w-28 lg:h-36 rounded-lg bg-gradient-to-br ${
                      i === 1 ? 'from-[#1DBF73] to-[#19A463]' :
                      i === 2 ? 'from-[#446EE7] to-[#3355CC]' :
                      i === 3 ? 'from-[#FF6B6B] to-[#EE5A5A]' :
                      'from-[#FFB84D] to-[#FFA033]'
                    } shadow-lg transform ${i === 2 ? '-translate-y-4' : i === 3 ? 'translate-y-2' : ''} hover:-translate-y-2 transition-transform cursor-pointer flex items-end p-3`}
                  >
                    <span className="text-white text-xs font-medium">
                      {i === 1 ? 'Top Seller' : i === 2 ? 'Rising Star' : i === 3 ? 'Expert' : 'Pro'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Success Looks Like */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-light text-[#222325] mb-4">
            What success on Closo looks like
          </h2>
          <p className="text-[#74767E] mb-10">
            Our top sellers share their journey to financial freedom.
          </p>

          {/* Video/Image Testimonial */}
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#F5F5F5]">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"
              alt="Success story"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
              <p className="text-white text-xl lg:text-2xl font-light">
                &quot;Closo helped us to access top sales talent worldwide&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guides Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl sm:text-4xl font-light text-[#222325]">
              Guides to help you grow
            </h2>
            <Link href="#" className="text-[#222325] hover:underline font-medium flex items-center gap-1">
              See more guides
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <Link key={guide.id} href="#" className="group">
                <div className="aspect-[4/3] rounded-lg overflow-hidden mb-4">
                  <img
                    src={guide.image}
                    alt={guide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-[#222325] font-medium group-hover:underline">
                  {guide.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
