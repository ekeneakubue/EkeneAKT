"use client";

import { signOut } from "@/actions/auth";
import { useSidebarStore } from "@/lib/store";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function Header({ email }: { email: string }) {
	const { toast } = useToast();
	const { push } = useRouter();
	const { toggle } = useSidebarStore();
	return (
		<header className="flex h-16 items-center justify-between border-b px-4">
			<Button
				variant="ghost"
				size="icon"
				className="lg:hidden"
				onClick={() => toggle()}
			>
				<Menu className="h-6 w-6" />
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="relative h-8 w-8 rounded-full">
						<Avatar>
							<AvatarImage src="" />
							<AvatarFallback>{email.substring(0, 1)}</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="space-y-2">
					<DropdownMenuLabel>My Account</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						<Link href={"/settings"}>Settings</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						className="bg-destructive"
						onClick={async () => {
							const { redirectTo, error } = await signOut();
							if (error) {
								toast({
									title: "Sign out failed",
									description: error,
									variant: "destructive",
								});
								return;
							}
							if (redirectTo) {
								push(redirectTo);
							}
						}}
					>
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</header>
	);
}
