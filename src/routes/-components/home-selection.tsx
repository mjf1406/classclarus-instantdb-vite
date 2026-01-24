/** @format */

import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
    StudentIcon,
    TeacherIcon,
    GuardianIcon,
    AdminIcon,
} from "@/components/icons/role-icons";
import { UserCard } from "@/components/navigation/user-card";
import { UserPlus, LogIn } from "lucide-react";

interface HomeSelectionOption {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    route: string;
}

const options: HomeSelectionOption[] = [
    {
        title: "Student",
        icon: StudentIcon,
        route: "/join/class",
    },
    {
        title: "Teacher",
        icon: TeacherIcon,
        route: "/classes",
    },
    {
        title: "Parent/Guardian",
        icon: GuardianIcon,
        route: "/join/class",
    },
    {
        title: "School Admin",
        icon: AdminIcon,
        route: "/organizations",
    },
];

export function HomeSelection() {
    const navigate = useNavigate();

    const handleSelect = (route: string) => {
        navigate({ to: route });
    };

    return (
        <div className="flex min-h-screen items-start justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold">
                        I am a...
                    </h1>
                </div>
                <div className="flex flex-col gap-3">
                    {options.map((option) => {
                        const Icon = option.icon;
                        return (
                            <Button
                                key={option.title}
                                size="lg"
                                variant="secondary"
                                className="w-full justify-start gap-3 h-auto py-4"
                                onClick={() => handleSelect(option.route)}
                            >
                                <Icon className="size-5" />
                                <span className="text-base font-medium">
                                    {option.title}
                                </span>
                            </Button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 border-t"></div>
                    <span className="text-sm text-muted-foreground">OR</span>
                    <div className="flex-1 border-t"></div>
                </div>
                <div className="flex flex-col gap-3">
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-4"
                        asChild
                    >
                        <Link to="/join/organization">
                            <UserPlus className="size-5" />
                            <span className="text-base font-medium">
                                Join Organization
                            </span>
                        </Link>
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-4"
                        asChild
                    >
                        <Link to="/join/class">
                            <LogIn className="size-5" />
                            <span className="text-base font-medium">
                                Join Class
                            </span>
                        </Link>
                    </Button>
                </div>
                <UserCard />
            </div>
        </div>
    );
}
