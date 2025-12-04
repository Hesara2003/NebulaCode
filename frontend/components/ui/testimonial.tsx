/* eslint-disable react/no-unescaped-entities */
"use client";
import { TimelineContent } from "@/components/ui/timeline-animation";
import Image from "next/image";
import { useRef } from "react";
import { motion } from "framer-motion";

function ClientFeedback() {
    const testimonialRef = useRef<HTMLDivElement>(null);
  
    const revealVariants = {
      visible: (i: number) => ({
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: {
          delay: i * 0.4,
          duration: 0.5,
        },
      }),
      hidden: {
        filter: "blur(10px)",
        y: -20,
        opacity: 0,
      },
    };
  
  return (
    <main className="w-full bg-black text-white">
      <section className="relative h-full container mx-auto rounded-lg py-14 bg-black" ref={testimonialRef}>
        <article className={"max-w-screen-md mx-auto text-center space-y-2 "} >
          <TimelineContent as={motion.h1} className={"xl:text-4xl text-3xl font-medium font-heading"} animationNum={0} customVariants={revealVariants} timelineRef={testimonialRef}>
            Trusted by Startups and the world's largest companies
          </TimelineContent>
          <TimelineContent as={motion.p} className={"mx-auto text-gray-400"} animationNum={1} customVariants={revealVariants} timelineRef={testimonialRef}>
            Let's hear how NebulaCode clients feel about our service
          </TimelineContent>
        </article>
        <div className="lg:grid lg:grid-cols-3 gap-2 flex flex-col w-full lg:py-10 pt-10 pb-4 lg:px-10 px-4">
          <div className="md:flex lg:flex-col lg:space-y-2 h-full lg:gap-0 gap-2 ">
            <TimelineContent as={motion.div} animationNum={0} customVariants={revealVariants} timelineRef={testimonialRef} className=" lg:flex-[7] flex-[6] flex flex-col justify-between relative bg-[#111] overflow-hidden rounded-lg border border-white/10 p-5">
              <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:50px_56px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
              <article className="mt-auto relative z-10">
                <p className="text-gray-300">
                  "NebulaCode has been a game-changer for us. Their service is
                  top-notch and their team is incredibly responsive."
                </p>
                <div className="flex justify-between pt-5">
                  <div>
                    <h2 className=" font-semibold lg:text-xl text-sm text-white">
                      Guillermo Rauch
                    </h2>
                    <p className="text-gray-500 text-sm">CEO of Enigma</p>
                  </div>
                  <Image
                    src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=687&auto=format&fit=crop"
                    alt="logo"
                    width={200}
                    height={200}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
            <TimelineContent as={motion.div} animationNum={1} customVariants={revealVariants} timelineRef={testimonialRef} className="lg:flex-[3] flex-[4] lg:h-fit lg:shrink-0 flex flex-col justify-between relative bg-blue-900/20 text-white overflow-hidden rounded-lg border border-blue-500/20 p-5">
              <article className="mt-auto">
                <p className="text-gray-300">
                  "We've seen incredible results with NebulaCode. Their
                  expertise, dedication."
                </p>
                <div className="flex justify-between pt-5">
                  <div>
                    <h2 className=" font-semibold text-xl">Rika Shinoda</h2>
                    <p className="text-gray-500 text-sm">CEO of Kintsugi</p>
                  </div>
                  <Image
                    src="https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?q=80&w=687&auto=format&fit=crop"
                    alt="logo"
                    width={200}
                    height={200}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>
          <div className="lg:h-full md:flex lg:flex-col h-fit lg:space-y-2 lg:gap-0 gap-2">
            <TimelineContent as={motion.div} animationNum={2} customVariants={revealVariants} timelineRef={testimonialRef} className="flex flex-col justify-between relative bg-[#111] text-white overflow-hidden rounded-lg border border-white/10 p-5">
              <article className="mt-auto">
                <p className="2xl:text-base text-sm text-gray-300">
                  "Their team is highly professional, and their innovative
                  solutions have truly transformed the way we operate."
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className=" font-semibold lg:text-xl text-lg">
                      Reacher{" "}
                    </h2>
                    <p className="lg:text-base text-sm text-gray-500">CEO of OdeaoLabs</p>
                  </div>
                  <Image
                    src="https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=1021&auto=format&fit=crop"
                    alt="logo"
                    width={200}
                    height={200}
                    className="lg:w-16 lg:h-16 w-12 h-12 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
            <TimelineContent as={motion.div} animationNum={3} customVariants={revealVariants} timelineRef={testimonialRef} className="flex flex-col justify-between relative bg-[#111] text-white overflow-hidden rounded-lg border border-white/10 p-5">
              <article className="mt-auto">
                <p className="2xl:text-base text-sm text-gray-300">
                  "We're extremely satisfied with NebulaCode. Their expertise
                  and dedication have exceeded our expectations."
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className=" font-semibold lg:text-xl text-lg">John </h2>
                    <p className="lg:text-base text-sm text-gray-500">CEO of Labsbo</p>
                  </div>
                  <Image
                    src="https://images.unsplash.com/photo-1615109398623-88346a601842?q=80&w=687&auto=format&fit=crop"
                    alt="logo"
                    width={200}
                    height={200}
                    className="lg:w-16 lg:h-16 w-12 h-12 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
            <TimelineContent as={motion.div} animationNum={4} customVariants={revealVariants} timelineRef={testimonialRef} className="flex flex-col justify-between relative bg-[#111] text-white overflow-hidden rounded-lg border border-white/10 p-5">
              <article className="mt-auto">
                <p className="2xl:text-base text-sm text-gray-300">
                  "Their customer support is absolutely exceptional. They are
                  always available, incredibly helpful."
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className=" font-semibold lg:text-xl text-lg">
                      Steven Sunny
                    </h2>
                    <p className="lg:text-base text-sm text-gray-500">CEO of boxefi</p>
                  </div>
                  <Image
                    src="https://images.unsplash.com/photo-1740102074295-c13fae3e4f8a?q=80&w=687&auto=format&fit=crop"
                    alt="logo"
                    width={200}
                    height={200}
                    className="lg:w-16 lg:h-16 w-12 h-12 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>
          <div className="h-full md:flex lg:flex-col lg:space-y-2 lg:gap-0 gap-2">
            <TimelineContent as={motion.div} animationNum={5} customVariants={revealVariants} timelineRef={testimonialRef} className=" lg:flex-[3] flex-[4] flex flex-col justify-between relative bg-blue-900/20 text-white overflow-hidden rounded-lg border border-blue-500/20 p-5">
              <article className="mt-auto">
                <p className="text-gray-300">
                  "NebulaCode has been a key partner in our growth journey."
                </p>
                <div className="flex justify-between pt-5">
                  <div>
                    <h2 className=" font-semibold text-xl">Guillermo Rauch</h2>
                    <p className="text-gray-500 text-sm">CEO of OdeaoLabs</p>
                  </div>
                  <Image
                    src="https://images.unsplash.com/photo-1563237023-b1e970526dcb?q=80&w=765&auto=format&fit=crop"
                    alt="logo"
                    width={200}
                    height={200}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
            <TimelineContent as={motion.div} animationNum={6} customVariants={revealVariants} timelineRef={testimonialRef} className="lg:flex-[7] flex-[6] flex flex-col justify-between relative bg-[#111] overflow-hidden rounded-lg border border-white/10 p-5">
              <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:50px_56px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
              <article className="mt-auto relative z-10">
                <p className="text-gray-300">
                  "NebulaCode has been a true game-changer for us. Their
                  exceptional service, combined with their deep expertise and
                  commitment to excellence, has made a significant impact on our
                  business."
                </p>
                <div className="flex justify-between pt-5">
                  <div>
                    <h2 className=" font-semibold text-xl">Paul Brauch</h2>
                    <p className="text-gray-500 text-sm">CTO of Spectrum</p>
                  </div>
                  <Image
                    src="https://images.unsplash.com/photo-1590086782957-93c06ef21604?q=80&w=687&auto=format&fit=crop"
                    alt="logo"
                    width={200}
                    height={200}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>
        </div>

        <div className="absolute border-b-2 border-white/10 bottom-4 h-16 z-[2] md:w-full w-[90%] md:left-0 left-[5%]">
          <div className="container mx-auto w-full h-full relative before:absolute before:-left-2 before:-bottom-2 before:w-4 before:h-4 before:bg-black before:shadow-sm before:border border-white/10 before:border-white/20 after:absolute after:-right-2 after:-bottom-2 after:w-4 after:h-4 after:bg-black after:shadow-sm after:border after:border-white/20 "></div>
        </div>
      </section>
    </main>
  );
}

export default ClientFeedback;
