import { Variants } from "framer-motion";

export const fadeInUp: Variants = {
    hidden: {
        opacity: 0,
        y: 24,
        filter: "blur(10px)",
    },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            duration: 0.7,
            ease: [0.25, 0.4, 0.25, 1],
        },
    },
};

export const staggerChildren: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.1,
        },
    },
};

export const scaleIn: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.92,
        filter: "blur(8px)",
    },
    visible: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            duration: 0.5,
            ease: [0.25, 0.4, 0.25, 1],
        },
    },
};

export const slideInLeft: Variants = {
    hidden: {
        opacity: 0,
        x: -30,
        filter: "blur(6px)",
    },
    visible: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: {
            duration: 0.6,
            ease: [0.25, 0.4, 0.25, 1],
        },
    },
};

export const slideInRight: Variants = {
    hidden: {
        opacity: 0,
        x: 30,
        filter: "blur(6px)",
    },
    visible: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: {
            duration: 0.6,
            ease: [0.25, 0.4, 0.25, 1],
        },
    },
};

export const blurIn: Variants = {
    hidden: {
        opacity: 0,
        filter: "blur(20px)",
    },
    visible: {
        opacity: 1,
        filter: "blur(0px)",
        transition: {
            duration: 0.8,
            ease: [0.25, 0.4, 0.25, 1],
        },
    },
};
