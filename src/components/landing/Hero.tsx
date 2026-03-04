import { Canvas } from "@react-three/fiber";
import { Globe } from "./3d/Globe";
import { Button } from "@/components/ui/design-system/Button";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren, blurIn } from "@/lib/animations";
import { ArrowRight, MessageSquare } from "lucide-react";

import { useChat } from "@/context/ChatContext";

export const Hero = () => {
    const { openChat } = useChat();

    return (
        <section className="relative min-h-screen w-full overflow-hidden bg-background flex items-center justify-center pt-20 lg:pt-0 dark">
            <div className="container px-4 md:px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center h-full">

                {/* Text Content */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerChildren}
                    className="flex flex-col gap-6 text-center lg:text-left pt-10 lg:pt-0"
                >
                    <motion.div variants={fadeInUp}>
                        <span className="inline-block py-1.5 px-4 rounded-full bg-electric-purple/10 text-electric-purple text-sm font-medium mb-4 border border-electric-purple/20 backdrop-blur-sm">
                            The Future of Workforce
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-display tracking-tight text-balance leading-[1.1] text-foreground">
                            Build AI Agents. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-purple via-violet-400 to-electric-cyan">
                                Hire Human Experts.
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p
                        variants={fadeInUp}
                        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 text-balance"
                    >
                        The only integrated platform that delivers the optimal solution for your business challenge—whether it's intelligent automation or specialized human talent.
                    </motion.p>

                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                    >
                        <Button
                            variant="neubrutalist"
                            size="lg"
                            className="group w-full sm:w-auto"
                            onClick={openChat}
                        >
                            <MessageSquare className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                            Talk to AI Assistant
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="group w-full sm:w-auto"
                            onClick={() => window.location.href = '/login'}
                        >
                            Login to Platform
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </motion.div>
                </motion.div>

                {/* 3D Visual */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={blurIn}
                    className="h-[50vh] lg:h-[800px] w-full relative flex items-center justify-center"
                >
                    {/* Ambient glow */}
                    <div className="absolute inset-0 bg-gradient-radial from-electric-purple/15 via-electric-purple/5 to-transparent opacity-60 blur-3xl pointer-events-none" />
                    <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-electric-cyan/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

                    <div className="w-full h-full">
                        <Canvas camera={{ position: [0, 0, 9], fov: 45 }} resize={{ scroll: false }}>
                            <Globe />
                        </Canvas>
                    </div>
                </motion.div>
            </div>

            {/* Background grid with fade */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-background">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
            </div>
        </section>
    );
};
