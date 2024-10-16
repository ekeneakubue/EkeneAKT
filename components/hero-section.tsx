"use client";

import Image from "next/image";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const images = [
	"/images/bulb-light.jpg",
	"/images/bulb.jpg",
	"/images/lights-dark.jpg",
	"/images/circuit.jpg",
	"/images/macbook.jpg",
];

export function HeroSection() {
	return (
		<section className="relative w-full h-[50vh] min-h-[300px]">
			<Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 5000 })]}>
				<CarouselContent>
					{images.map((image, index) => (
						<CarouselItem key={image}>
							<div className="w-full h-[50vh] min-h-[300px] relative">
								<Image
									src={image}
									alt={`Slide ${index + 1}`}
									fill
									sizes="100vw"
									priority={index === 0}
									style={{ objectFit: "cover", objectPosition: "center" }}
									quality={100}
									className="rounded-md shadow-xl"
								/>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>
			<div className="absolute inset-0 flex items-center justify-center z-10">
				<Card className="bg-inherit/80 backdrop-blur-sm max-w-lg w-full mx-4">
					<CardHeader>
						<CardTitle className="text-3xl font-bold">
							Bulk Buying Made Easy
						</CardTitle>
						<CardDescription className="text-lg mt-2">
							Discover wholesale prices on a wide range of products. Save big
							when you buy in bulk!
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button className="rounded-full">
							<Link href="/search">Shop now</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</section>
	);
}
